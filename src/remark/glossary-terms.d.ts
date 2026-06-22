export interface GlossaryTerm {
  term: string;
  definition: string;
  abbreviation?: string;
  aliases?: string[];
  autoLink?: boolean;
  caseSensitive?: boolean;
}

export interface RemarkGlossaryTermsOptions {
  terms?: GlossaryTerm[];
  glossaryPath?: string | null;
  routePath?: string;
  siteDir?: string | null;
  expandAcronymsOnFirstUse?: boolean;
}

export type RemarkGlossaryTermsTransformer = (tree: unknown) => unknown;

export default function remarkGlossaryTerms(
  options?: RemarkGlossaryTermsOptions
): RemarkGlossaryTermsTransformer;

export function clearGlossaryCache(filePath?: string): void;
