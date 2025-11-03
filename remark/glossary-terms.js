// Support both CJS and ESM exports of unist-util-visit
let visit = require('unist-util-visit');
visit = visit && visit.visit ? visit.visit : visit;
const path = require('path');
const fs = require('fs');

/**
 * Creates a remark plugin that automatically detects and replaces glossary terms in markdown
 *
 * @param {object} options - Plugin options
 * @param {Array} options.terms - Array of glossary term objects with {term, definition}
 * @param {string} options.glossaryPath - Path to glossary JSON file (optional, if terms not provided)
 * @param {string} options.routePath - Route path to glossary page (default: '/glossary')
 * @param {string} options.siteDir - Docusaurus site directory (required if using glossaryPath)
 * @returns {function} Remark plugin function
 */
function remarkGlossaryTerms({
  terms = [],
  glossaryPath = null,
  routePath = '/glossary',
  siteDir = null,
} = {}) {
  let glossaryTerms = terms;

  // If terms not provided, try to load from glossaryPath (synchronously)
  if (!glossaryTerms.length && glossaryPath && siteDir) {
    try {
      const glossaryFilePath = path.resolve(siteDir, glossaryPath);
      if (fs.existsSync(glossaryFilePath)) {
        const glossaryData = JSON.parse(fs.readFileSync(glossaryFilePath, 'utf8'));
        glossaryTerms = glossaryData.terms || [];
      }
    } catch (error) {
      console.warn(`Failed to load glossary from ${glossaryPath}:`, error.message);
    }
  }

  // Build a map of terms for efficient lookup
  // Key: lowercase term, Value: term object with original case
  const termMap = new Map();
  glossaryTerms.forEach(termObj => {
    if (termObj.term) {
      termMap.set(termObj.term.toLowerCase(), termObj);
    }
  });

  // Sort terms by length (longest first) to avoid partial matches
  // e.g., "Application Programming Interface" should match before "API"
  const sortedTerms = Array.from(termMap.entries()).sort((a, b) => b[0].length - a[0].length);

  // If no terms, return a no-op transformer
  if (sortedTerms.length === 0) {
    return tree => tree;
  }

  /**
   * Recursively replace glossary terms in text
   * Returns an array of text nodes and MDX components
   */
  function replaceTermsInText(text, position) {
    if (!text || !sortedTerms.length) {
      return [{ type: 'text', value: text }];
    }

    const result = [];
    let lastIndex = 0;
    let textLower = text.toLowerCase();

    // Find all matches
    const matches = [];
    for (const [lowerTerm, termObj] of sortedTerms) {
      const term = termObj.term;
      let searchIndex = 0;

      while (searchIndex < textLower.length) {
        const index = textLower.indexOf(lowerTerm, searchIndex);
        if (index === -1) break;

        // Check if it's a whole word match, with simple plural tolerance ('s' or 'es')
        const beforeChar = index > 0 ? textLower[index - 1] : ' ';
        const afterIndex = index + lowerTerm.length;
        const afterChar = afterIndex < textLower.length 
          ? textLower[afterIndex] 
          : ' ';
        
        let matchLength = term.length;
        let isWordBoundary = !/\w/.test(beforeChar) && !/\w/.test(afterChar);

        // Allow trailing 's' plural (e.g., webhook -> webhooks)
        if (!isWordBoundary && afterChar === 's') {
          const nextChar = afterIndex + 1 < textLower.length ? textLower[afterIndex + 1] : ' ';
          if (!/\w/.test(nextChar)) {
            isWordBoundary = true;
            matchLength = term.length + 1;
          }
        }

        // Allow trailing 'es' plural (e.g., API -> APIs, box -> boxes)
        if (!isWordBoundary && afterChar === 'e' && afterIndex + 1 < textLower.length && textLower[afterIndex + 1] === 's') {
          const nextChar = afterIndex + 2 < textLower.length ? textLower[afterIndex + 2] : ' ';
          if (!/\w/.test(nextChar)) {
            isWordBoundary = true;
            matchLength = term.length + 2;
          }
        }

        if (isWordBoundary) {
          matches.push({
            index,
            length: matchLength,
            term: term,
            termObj: termObj,
            // Store original case from the text
            originalText: text.substring(index, index + matchLength)
          });
        }

        searchIndex = index + 1;
      }
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Remove overlapping matches (keep the first one)
    const nonOverlappingMatches = [];
    let lastMatchEnd = 0;
    for (const match of matches) {
      if (match.index >= lastMatchEnd) {
        nonOverlappingMatches.push(match);
        lastMatchEnd = match.index + match.length;
      }
    }

    // Build result array
    for (const match of nonOverlappingMatches) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          value: text.substring(lastIndex, match.index),
        });
      }

      // Add MDX component for glossary term
      result.push({
        type: 'mdxJsxFlowElement',
        name: 'GlossaryTerm',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'term',
            value: match.termObj.term,
          },
          {
            type: 'mdxJsxAttribute',
            name: 'definition',
            value: match.termObj.definition || '',
          },
          {
            type: 'mdxJsxAttribute',
            name: 'routePath',
            value: routePath,
          },
        ],
        children: [
          {
            type: 'text',
            value: match.originalText,
          },
        ],
      });

      lastIndex = match.index + match.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        value: text.substring(lastIndex),
      });
    }

    return result.length > 0 ? result : [{ type: 'text', value: text }];
  }

  return tree => {
    let usedGlossaryTerm = false;
    visit(tree, 'text', (node, index, parent) => {
      // Skip text nodes inside code blocks, links, or existing MDX components
      if (
        parent.type === 'code' ||
        parent.type === 'inlineCode' ||
        parent.type === 'link' ||
        parent.type === 'mdxJsxFlowElement' ||
        parent.type === 'mdxJsxTextElement'
      ) {
        return;
      }

      // Replace terms in text node
      const replacements = replaceTermsInText(node.value);

      // If we have replacements, replace the single text node with multiple nodes
      if (
        replacements.length > 1 ||
        (replacements.length === 1 && replacements[0].type !== 'text')
      ) {
        // Convert to text elements for paragraph context if needed
        const newNodes = replacements.map(replacement => {
          if (replacement.type === 'mdxJsxFlowElement') {
            // In paragraph context, we need mdxJsxTextElement instead
            if (parent.type === 'paragraph') {
              return {
                type: 'mdxJsxTextElement',
                name: replacement.name,
                attributes: replacement.attributes,
                children: replacement.children,
              };
            }
          }
          if (
            replacement.type === 'mdxJsxFlowElement' ||
            replacement.type === 'mdxJsxTextElement'
          ) {
            usedGlossaryTerm = true;
          }
          return replacement;
        });

        // Replace the single node with multiple nodes
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length - 1; // Return new index to continue
      }
    });

    // Inject MDX import for GlossaryTerm if we used it anywhere in this file
    if (usedGlossaryTerm) {
      // Create import node matching MDX v3 expectations
      // Both 'value' (the import string) and 'data.estree' (the parsed AST) are required
      const importNode = {
        type: 'mdxjsEsm',
        value: "import GlossaryTerm from '@theme/GlossaryTerm'",
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ImportDeclaration',
                specifiers: [
                  {
                    type: 'ImportDefaultSpecifier',
                    local: { type: 'Identifier', name: 'GlossaryTerm' },
                  },
                ],
                source: {
                  type: 'Literal',
                  value: '@theme/GlossaryTerm',
                  raw: "'@theme/GlossaryTerm'"
                },
              },
            ],
          },
        },
      };

      // Avoid duplicate imports if already present
      const hasExistingImport =
        Array.isArray(tree.children) &&
        tree.children.some(n => {
          if (n.type !== 'mdxjsEsm') return false;
          // Check value string (for older MDX format)
          if (typeof n.value === 'string' && n.value.includes('@theme/GlossaryTerm')) {
            return true;
          }
          // Check estree data (for newer MDX format)
          if (n.data?.estree?.body) {
            return n.data.estree.body.some(
              stmt =>
                stmt.type === 'ImportDeclaration' &&
                stmt.source?.value === '@theme/GlossaryTerm'
            );
          }
          return false;
        });
      
      if (!hasExistingImport) {
        // Place import at the very beginning of the file (before all other nodes)
        // This ensures it's available when MDX compiles the JSX elements
        if (!Array.isArray(tree.children)) {
          tree.children = [];
        }
        // Insert at the very beginning (index 0) to ensure it's processed first
        tree.children.unshift(importNode);
        // Debug: verify import was added (remove in production)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[glossary-plugin] Injected GlossaryTerm import');
        }
      }
    }
  };
}

module.exports = remarkGlossaryTerms;
