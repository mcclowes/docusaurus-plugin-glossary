/**
 * Shared type definitions for docusaurus-plugin-glossary.
 *
 * Single source of truth for the *declared* public data shapes. Both the plugin
 * entry point (`src/index.ts`) and the remark plugin declaration
 * (`src/remark/glossary-terms.d.ts`) consume these, so the declarations can't
 * drift from each other.
 *
 * Note: the remark runtime (`src/remark/glossary-terms.js`) is plain JS with
 * `checkJs: false`, so it is NOT type-checked against these shapes — keep it in
 * sync by hand.
 */

/** A single glossary entry. */
export interface GlossaryTerm {
  term: string;
  definition: string;
  abbreviation?: string;
  relatedTerms?: string[];
  id?: string;
  autoLink?: boolean;
  aliases?: string[];
  caseSensitive?: boolean;
}

/** Shape of a glossary JSON file. */
export interface GlossaryData {
  title?: string;
  description?: string;
  terms: GlossaryTerm[];
}

/** Options accepted by the glossary plugin / preset. */
export interface GlossaryPluginOptions {
  glossaryPath?: string;
  routePath?: string;
  autoLinkTerms?: boolean;
  /**
   * When true, the first canonical occurrence of any term that has an `abbreviation` is
   * rendered as "Long Form (Term)" instead of just "Term", enforcing the convention of
   * introducing an acronym on first use. Subsequent occurrences in the same file render
   * normally. Default: false.
   */
  expandAcronymsOnFirstUse?: boolean;
}

/** Options accepted by the `remark/glossary-terms` plugin. */
export interface RemarkGlossaryTermsOptions {
  terms?: GlossaryTerm[];
  glossaryPath?: string | null;
  routePath?: string;
  siteDir?: string | null;
  expandAcronymsOnFirstUse?: boolean;
}

/** The transformer returned by the remark plugin factory. */
export type RemarkGlossaryTermsTransformer = (tree: unknown) => unknown;
