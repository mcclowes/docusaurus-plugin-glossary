import { visit } from 'unist-util-visit';
import path from 'path';
import fs from 'fs';

/**
 * Simple validation for glossary terms loaded from file
 * Returns only valid terms with required fields
 *
 * @param {unknown} data - The parsed JSON data
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {{ terms: Array<{term: string, definition: string}>, errors: string[] }}
 */
function validateGlossaryTerms(data, filePath) {
  const errors = [];
  const validTerms = [];

  if (data === null || data === undefined) {
    errors.push(`Glossary data is null or undefined`);
    return { terms: [], errors };
  }

  if (typeof data !== 'object') {
    errors.push(`Glossary data must be an object, got ${typeof data}`);
    return { terms: [], errors };
  }

  if (!('terms' in data)) {
    errors.push(`Glossary data must contain a "terms" array`);
    return { terms: [], errors };
  }

  if (!Array.isArray(data.terms)) {
    errors.push(`Field "terms" must be an array, got ${typeof data.terms}`);
    return { terms: [], errors };
  }

  data.terms.forEach((term, index) => {
    if (term === null || term === undefined || typeof term !== 'object') {
      errors.push(`terms[${index}]: Term must be an object`);
      return;
    }

    if (typeof term.term !== 'string' || term.term.trim() === '') {
      errors.push(`terms[${index}]: Missing or invalid "term" field`);
      return;
    }

    if (typeof term.definition !== 'string') {
      errors.push(`terms[${index}]: Missing or invalid "definition" field`);
      return;
    }

    validTerms.push(term);
  });

  return { terms: validTerms, errors };
}

// Cache for glossary data to avoid repeated synchronous file reads
// Key: absolute file path, Value: { terms, loadedAt }
const glossaryCache = new Map();
const CACHE_TTL = 5000; // 5 seconds TTL to allow for file changes during dev

/**
 * Creates a remark plugin that automatically detects and replaces glossary terms in markdown
 *
 * This plugin transforms plain text terms into <GlossaryTerm> JSX elements.
 * The GlossaryTerm component is globally available via the MDXComponents theme wrapper,
 * so no import injection is needed - MDX files can use it without explicit imports.
 *
 * @param {object} options - Plugin options
 * @param {Array} options.terms - Array of glossary term objects with {term, definition}
 * @param {string} options.glossaryPath - Path to glossary JSON file (optional, if terms not provided)
 * @param {string} options.routePath - Route path to glossary page (default: '/glossary')
 * @param {string} options.siteDir - Docusaurus site directory (required if using glossaryPath)
 * @returns {function} Remark plugin function
 */
export default function remarkGlossaryTerms({
  terms = [],
  glossaryPath = null,
  routePath = '/glossary',
  siteDir = null,
} = {}) {
  let glossaryTerms = terms;

  // If terms not provided, try to load from glossaryPath with caching
  if (!glossaryTerms.length && glossaryPath && siteDir) {
    try {
      const glossaryFilePath = path.resolve(siteDir, glossaryPath);
      const now = Date.now();

      // Check cache first to avoid repeated file reads
      const cached = glossaryCache.get(glossaryFilePath);
      if (cached && now - cached.loadedAt < CACHE_TTL) {
        glossaryTerms = cached.terms;
      } else {
        // Cache miss or expired - load from file synchronously
        // Note: This is synchronous I/O which can block the build process
        // Consider passing terms directly to avoid this
        if (fs.existsSync(glossaryFilePath)) {
          const fileContent = fs.readFileSync(glossaryFilePath, 'utf8');
          let glossaryData;
          try {
            glossaryData = JSON.parse(fileContent);
          } catch (parseError) {
            console.error(
              `[glossary-plugin] Failed to parse glossary JSON at ${glossaryPath}:`,
              parseError.message
            );
            glossaryCache.set(glossaryFilePath, {
              terms: [],
              loadedAt: now,
            });
            return tree => tree;
          }

          // Validate glossary data
          const { terms: validTerms, errors } = validateGlossaryTerms(glossaryData, glossaryPath);

          if (errors.length > 0) {
            console.warn(`[glossary-plugin] Glossary validation errors in ${glossaryPath}:`);
            errors.forEach(err => console.warn(`  - ${err}`));
            if (validTerms.length > 0) {
              console.warn(`[glossary-plugin] Proceeding with ${validTerms.length} valid term(s).`);
            }
          }

          glossaryTerms = validTerms;

          // Update cache
          glossaryCache.set(glossaryFilePath, {
            terms: glossaryTerms,
            loadedAt: now,
          });

          // Log only once per file (when cache is first populated)
          if (!cached && process.env.NODE_ENV !== 'production') {
            console.log(
              `[glossary-plugin] Loaded ${glossaryTerms.length} terms from ${glossaryPath}`
            );
          }
        } else {
          // File doesn't exist - cache empty result to avoid repeated checks
          glossaryCache.set(glossaryFilePath, {
            terms: [],
            loadedAt: now,
          });
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[glossary-plugin] Glossary file not found: ${glossaryPath}`);
          }
        }
      }
    } catch (error) {
      console.warn(
        `[glossary-plugin] Failed to load glossary from ${glossaryPath}:`,
        error.message
      );
      // Cache the error to avoid repeated attempts
      if (glossaryPath && siteDir) {
        const glossaryFilePath = path.resolve(siteDir, glossaryPath);
        glossaryCache.set(glossaryFilePath, {
          terms: [],
          loadedAt: Date.now(),
        });
      }
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
    const textLower = text.toLowerCase();

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
        const afterChar = afterIndex < textLower.length ? textLower[afterIndex] : ' ';

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
        if (
          !isWordBoundary &&
          afterChar === 'e' &&
          afterIndex + 1 < textLower.length &&
          textLower[afterIndex + 1] === 's'
        ) {
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
            originalText: text.substring(index, index + matchLength),
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

  // Return the transformer function
  const transformer = tree => {
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
              usedGlossaryTerm = true;
              return {
                type: 'mdxJsxTextElement',
                name: replacement.name,
                attributes: replacement.attributes,
                children: replacement.children,
              };
            }
            usedGlossaryTerm = true;
          }
          return replacement;
        });

        // Replace the single node with multiple nodes
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length - 1; // Return new index to continue
      }
    });

    // Inject MDX import for GlossaryTerm if we used it
    // The component is available via theme path, so we just need to import it
    if (usedGlossaryTerm) {
      const importNode = {
        type: 'mdxjsEsm',
        value: 'import GlossaryTerm from "@theme/GlossaryTerm";',
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
                  raw: '"@theme/GlossaryTerm"',
                },
              },
            ],
          },
        },
      };

      // Check for existing import
      const hasImport =
        Array.isArray(tree.children) &&
        tree.children.some(
          n =>
            n.type === 'mdxjsEsm' &&
            (n.value?.includes('@theme/GlossaryTerm') ||
              n.data?.estree?.body?.some(s => s.source?.value === '@theme/GlossaryTerm'))
        );

      if (!hasImport) {
        if (!Array.isArray(tree.children)) tree.children = [];
        let insertIndex = 0;
        for (let i = 0; i < tree.children.length; i++) {
          const node = tree.children[i];
          if (node.type === 'yaml' || node.type === 'toml') {
            insertIndex = i + 1;
          } else {
            break;
          }
        }
        tree.children.splice(insertIndex, 0, importNode);
      }
    }
  };

  return transformer;
}

/**
 * Clears the glossary cache
 * Useful for testing or when you want to force a reload of glossary data
 *
 * @param {string} [filePath] - Optional specific file path to clear. If not provided, clears entire cache.
 */
export function clearGlossaryCache(filePath) {
  if (filePath) {
    glossaryCache.delete(filePath);
  } else {
    glossaryCache.clear();
  }
}
