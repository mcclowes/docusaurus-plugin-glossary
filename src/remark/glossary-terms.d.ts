import type {
  GlossaryTerm,
  RemarkGlossaryTermsOptions,
  RemarkGlossaryTermsTransformer,
} from '../types.js';

export type { GlossaryTerm, RemarkGlossaryTermsOptions, RemarkGlossaryTermsTransformer };

export default function remarkGlossaryTerms(
  options?: RemarkGlossaryTermsOptions
): RemarkGlossaryTermsTransformer;

export function clearGlossaryCache(filePath?: string): void;
