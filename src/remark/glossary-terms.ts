import { visit } from 'unist-util-visit';
import path from 'path';
import fs from 'fs';
import { validateGlossaryData } from '../validation.js';
import type { PhrasingContent, Root, RootContent, Text } from 'mdast';
import type { MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import type { GlossaryTerm, RemarkGlossaryTermsOptions } from '../types.js';

interface CacheEntry {
  terms: GlossaryTerm[];
  loadedAt: number;
}

interface TermMatch {
  index: number;
  length: number;
  termObj: GlossaryTerm;
  originalText: string;
}

interface MatchableTerm {
  termObj: GlossaryTerm;
  phrase: string;
  caseSensitive: boolean;
}

// Cache for glossary data to avoid repeated synchronous file reads
// Key: absolute file path, Value: { terms, loadedAt }
const glossaryCache = new Map<string, CacheEntry>();
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
 * @param {boolean} options.expandAcronymsOnFirstUse - When true, the first canonical occurrence of a
 *   term with an `abbreviation` is rendered as "Long Form (Term)" instead of just "Term".
 *   Subsequent occurrences in the same file render unchanged. Default: false.
 * @returns {function} Remark plugin function
 */
export default function remarkGlossaryTerms({
  terms = [],
  glossaryPath = null,
  routePath = '/glossary',
  siteDir = null,
  expandAcronymsOnFirstUse = false,
}: RemarkGlossaryTermsOptions = {}) {
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
          let glossaryData: unknown;
          try {
            glossaryData = JSON.parse(fileContent);
          } catch (parseError) {
            console.error(
              `[glossary-plugin] Failed to parse glossary JSON at ${glossaryPath}:`,
              parseError instanceof Error ? parseError.message : String(parseError)
            );
            glossaryCache.set(glossaryFilePath, {
              terms: [],
              loadedAt: now,
            });
            return (tree: Root) => tree;
          }

          // Validate glossary data
          const validation = validateGlossaryData(glossaryData, { throwOnError: false });
          const validTerms = validation.data.terms;
          const { errors } = validation;

          if (errors.length > 0) {
            console.warn(`[glossary-plugin] Glossary validation errors in ${glossaryPath}:`);
            errors.forEach(err => console.warn(`  - [${err.field}] ${err.message}`));
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
        error instanceof Error ? error.message : String(error)
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

  // Build a map of terms for efficient lookup, skipping terms with autoLink: false.
  // Each entry represents a matchable phrase (canonical term or alias) and points
  // back to the canonical term object so tooltip/href always use the canonical form.
  // Key: lowercase phrase, Value: { termObj, phrase, caseSensitive } where
  // `phrase` preserves the original case (used for case-sensitive matching).
  const termMap = new Map<string, MatchableTerm>();
  glossaryTerms.forEach(termObj => {
    if (!termObj.term || termObj.autoLink === false) return;
    const caseSensitive = termObj.caseSensitive === true;

    const register = (phrase: string) => {
      if (typeof phrase !== 'string' || phrase.trim() === '') return;
      const key = phrase.toLowerCase();
      if (!termMap.has(key)) {
        termMap.set(key, { termObj, phrase, caseSensitive });
      }
    };

    register(termObj.term);
    if (Array.isArray(termObj.aliases)) {
      termObj.aliases.forEach(register);
    }
  });

  // Sort terms by length (longest first) to avoid partial matches
  // e.g., "Application Programming Interface" should match before "API"
  const sortedTerms = Array.from(termMap.entries()).sort((a, b) => b[0].length - a[0].length);

  // If no terms, return a no-op transformer
  if (sortedTerms.length === 0) {
    return (tree: Root) => tree;
  }

  /**
   * Recursively replace glossary terms in text
   * Returns an array of text nodes and MDX components
   *
   * @param {string} text - Source text to scan
   * @param {Set<string>} seenTerms - Per-file set tracking which canonical terms have already been
   *   rendered (used by expandAcronymsOnFirstUse to expand only on first occurrence).
   */
  function replaceTermsInText(text: string, seenTerms: Set<string>): PhrasingContent[] {
    if (!text || !sortedTerms.length) {
      return [{ type: 'text', value: text }];
    }

    const result: PhrasingContent[] = [];
    let lastIndex = 0;
    const textLower = text.toLowerCase();

    // Find all matches
    const matches: TermMatch[] = [];
    for (const [lowerPhrase, { termObj, phrase, caseSensitive }] of sortedTerms) {
      // Case-sensitive terms search the original text for the exact casing;
      // case-insensitive terms search the lowercased text for the lowercased phrase.
      const haystack = caseSensitive ? text : textLower;
      const needle = caseSensitive ? phrase : lowerPhrase;
      let searchIndex = 0;

      while (searchIndex < haystack.length) {
        const index = haystack.indexOf(needle, searchIndex);
        if (index === -1) break;

        // Check if it's a whole word match, with simple plural tolerance ('s' or 'es').
        // Word-boundary detection uses the lowercased text so letter-class checks
        // behave consistently regardless of the term's case-sensitivity setting.
        const beforeChar = index > 0 ? textLower[index - 1] : ' ';
        const afterIndex = index + needle.length;
        const afterChar = afterIndex < textLower.length ? textLower[afterIndex] : ' ';

        let matchLength = needle.length;
        let isWordBoundary = !/\w/.test(beforeChar) && !/\w/.test(afterChar);

        // Allow trailing 's' plural (e.g., webhook -> webhooks)
        if (!isWordBoundary && afterChar === 's') {
          const nextChar = afterIndex + 1 < textLower.length ? textLower[afterIndex + 1] : ' ';
          if (!/\w/.test(nextChar)) {
            isWordBoundary = true;
            matchLength = needle.length + 1;
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
            matchLength = needle.length + 2;
          }
        }

        if (isWordBoundary) {
          matches.push({
            index,
            length: matchLength,
            termObj: termObj,
            // Store original case from the text (what the reader actually wrote)
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

      const displayText = resolveDisplayText(match, text, seenTerms);
      // Mark this term as seen regardless of whether we expanded — once the reader
      // has encountered any occurrence (canonical or otherwise), the introduction
      // window has closed.
      seenTerms.add(match.termObj.term);

      // Add MDX component for glossary term
      result.push({
        type: 'mdxJsxTextElement',
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
          ...(match.termObj.id
            ? [
                {
                  type: 'mdxJsxAttribute',
                  name: 'id',
                  value: match.termObj.id,
                },
              ]
            : []),
          ...(match.termObj.documentation
            ? [
                {
                  type: 'mdxJsxAttribute',
                  name: 'documentationPath',
                  value: match.termObj.documentation.path,
                },
              ]
            : []),
        ],
        children: [
          {
            type: 'text',
            value: displayText,
          },
        ],
      } as MdxJsxTextElement);

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

  // Decide what text to render inside the GlossaryTerm element.
  // Default: the text as written. When expandAcronymsOnFirstUse is enabled and this is the
  // first canonical occurrence of a term that has an `abbreviation`, expand to
  // "Long Form (Term)" — unless the long form already appears immediately before the match
  // (e.g. the author wrote "Payment Service Provider (PSP)" themselves).
  function resolveDisplayText(match: TermMatch, text: string, seenTerms: Set<string>): string {
    const termObj = match.termObj;
    if (!expandAcronymsOnFirstUse) return match.originalText;
    if (!termObj.abbreviation) return match.originalText;
    if (seenTerms.has(termObj.term)) return match.originalText;

    // Only canonical matches — no aliases, no plural forms.
    const isCanonical =
      match.length === termObj.term.length &&
      match.originalText.toLowerCase() === termObj.term.toLowerCase();
    if (!isCanonical) return match.originalText;

    // If the long form is already present in the lookback window, skip expansion to
    // avoid "Payment Service Provider (Payment Service Provider (PSP))".
    const longForm = termObj.abbreviation;
    const lookbackWindow = longForm.length + 10;
    const lookbackStart = Math.max(0, match.index - lookbackWindow);
    const lookback = text.substring(lookbackStart, match.index).toLowerCase();
    if (lookback.includes(longForm.toLowerCase())) return match.originalText;

    return `${longForm} (${match.originalText})`;
  }

  // Collect text nodes that live inside a heading (h1-h6) so we can skip them.
  // Headings are excluded from auto-linking because glossary anchors inside
  // headings clash with the heading's own link/anchor behavior and are noisy.
  function collectHeadingTextNodes(tree: Root): WeakSet<Text> {
    const skip = new WeakSet<Text>();
    visit(tree, 'heading', headingNode => {
      visit(headingNode, 'text', textNode => {
        skip.add(textNode);
      });
    });
    return skip;
  }

  // Return the transformer function
  const transformer = (tree: Root): void => {
    let usedGlossaryTerm = false;
    const textNodesInHeadings = collectHeadingTextNodes(tree);
    // Per-file tracking: each transformer invocation gets a fresh Set so acronym
    // expansion fires at most once per term per file.
    const seenTerms = new Set<string>();
    visit(tree, 'text', (node, index, parent) => {
      if (index === undefined || !parent) return;
      // Skip text nodes inside code blocks, links, or existing MDX components
      if (parent.type === 'link' || parent.type === 'mdxJsxTextElement') {
        return;
      }

      // Skip text nodes that are descendants of a heading (h1-h6)
      if (textNodesInHeadings.has(node)) {
        return;
      }

      // Replace terms in text node
      const replacements = replaceTermsInText(node.value, seenTerms);

      // If we have replacements, replace the single text node with multiple nodes
      if (
        replacements.length > 1 ||
        (replacements.length === 1 && replacements[0].type !== 'text')
      ) {
        // Convert to text elements for paragraph context if needed
        const newNodes = replacements.map(replacement => {
          if (replacement.type === 'mdxJsxTextElement') usedGlossaryTerm = true;
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
      } as RootContent;

      // Check for existing import
      const hasImport =
        Array.isArray(tree.children) &&
        tree.children.some(
          n =>
            n.type === 'mdxjsEsm' &&
            (n.value?.includes('@theme/GlossaryTerm') ||
              n.data?.estree?.body?.some(
                statement =>
                  'source' in statement && statement.source?.value === '@theme/GlossaryTerm'
              ))
        );

      if (!hasImport) {
        if (!Array.isArray(tree.children)) tree.children = [];
        let insertIndex = 0;
        for (let i = 0; i < tree.children.length; i++) {
          const node = tree.children[i];
          if (
            (node as { type: string }).type === 'yaml' ||
            (node as { type: string }).type === 'toml'
          ) {
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
export function clearGlossaryCache(filePath?: string): void {
  if (filePath) {
    glossaryCache.delete(filePath);
  } else {
    glossaryCache.clear();
  }
}
