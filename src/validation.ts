import type { GlossaryData, GlossaryTerm } from './index.js';

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: GlossaryData;
}

/**
 * Validates a single glossary term object
 *
 * @param term - The term object to validate
 * @param index - The index in the terms array (for error messages)
 * @returns Array of validation errors (empty if valid)
 */
function validateTerm(term: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `terms[${index}]`;

  if (term === null || term === undefined) {
    errors.push({
      field: prefix,
      message: 'Term cannot be null or undefined',
      value: term,
    });
    return errors;
  }

  if (typeof term !== 'object') {
    errors.push({
      field: prefix,
      message: `Term must be an object, got ${typeof term}`,
      value: term,
    });
    return errors;
  }

  const termObj = term as Record<string, unknown>;

  // Required: term (string)
  if (!('term' in termObj)) {
    errors.push({
      field: `${prefix}.term`,
      message: 'Missing required field "term"',
    });
  } else if (typeof termObj.term !== 'string') {
    errors.push({
      field: `${prefix}.term`,
      message: `Field "term" must be a string, got ${typeof termObj.term}`,
      value: termObj.term,
    });
  } else if (termObj.term.trim() === '') {
    errors.push({
      field: `${prefix}.term`,
      message: 'Field "term" cannot be empty',
      value: termObj.term,
    });
  }

  // Required: definition (string)
  if (!('definition' in termObj)) {
    errors.push({
      field: `${prefix}.definition`,
      message: 'Missing required field "definition"',
    });
  } else if (typeof termObj.definition !== 'string') {
    errors.push({
      field: `${prefix}.definition`,
      message: `Field "definition" must be a string, got ${typeof termObj.definition}`,
      value: termObj.definition,
    });
  }

  // Optional: abbreviation (string)
  if ('abbreviation' in termObj && termObj.abbreviation !== undefined) {
    if (typeof termObj.abbreviation !== 'string') {
      errors.push({
        field: `${prefix}.abbreviation`,
        message: `Field "abbreviation" must be a string, got ${typeof termObj.abbreviation}`,
        value: termObj.abbreviation,
      });
    }
  }

  // Optional: relatedTerms (string[])
  if ('relatedTerms' in termObj && termObj.relatedTerms !== undefined) {
    if (!Array.isArray(termObj.relatedTerms)) {
      errors.push({
        field: `${prefix}.relatedTerms`,
        message: `Field "relatedTerms" must be an array, got ${typeof termObj.relatedTerms}`,
        value: termObj.relatedTerms,
      });
    } else {
      termObj.relatedTerms.forEach((relatedTerm, relatedIndex) => {
        if (typeof relatedTerm !== 'string') {
          errors.push({
            field: `${prefix}.relatedTerms[${relatedIndex}]`,
            message: `Related term must be a string, got ${typeof relatedTerm}`,
            value: relatedTerm,
          });
        }
      });
    }
  }

  // Optional: id (string)
  if ('id' in termObj && termObj.id !== undefined) {
    if (typeof termObj.id !== 'string') {
      errors.push({
        field: `${prefix}.id`,
        message: `Field "id" must be a string, got ${typeof termObj.id}`,
        value: termObj.id,
      });
    }
  }

  return errors;
}

/**
 * Validates glossary data structure
 *
 * Ensures the glossary data conforms to the expected schema:
 * - Must be an object with a "terms" array
 * - Each term must have "term" (string) and "definition" (string)
 * - Optional fields: abbreviation (string), relatedTerms (string[]), id (string)
 *
 * @param data - The data to validate
 * @param options - Validation options
 * @param options.throwOnError - If true, throws an error on validation failure (default: true)
 * @returns Validation result with errors and sanitized data
 * @throws Error if data is invalid and throwOnError is true
 */
export function validateGlossaryData(
  data: unknown,
  options: { throwOnError?: boolean } = {}
): ValidationResult {
  const { throwOnError = true } = options;
  const errors: ValidationError[] = [];

  // Check if data is null or undefined
  if (data === null || data === undefined) {
    errors.push({
      field: 'root',
      message: 'Glossary data cannot be null or undefined',
      value: data,
    });

    if (throwOnError && errors.length > 0) {
      throw new GlossaryValidationError(errors);
    }

    return { valid: false, errors, data: { terms: [] } };
  }

  // Check if data is an object
  if (typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: `Glossary data must be an object, got ${typeof data}`,
      value: data,
    });

    if (throwOnError && errors.length > 0) {
      throw new GlossaryValidationError(errors);
    }

    return { valid: false, errors, data: { terms: [] } };
  }

  const glossaryData = data as Record<string, unknown>;

  // Check for terms array
  if (!('terms' in glossaryData)) {
    errors.push({
      field: 'terms',
      message: 'Glossary data must contain a "terms" array',
    });

    if (throwOnError && errors.length > 0) {
      throw new GlossaryValidationError(errors);
    }

    return { valid: false, errors, data: { terms: [] } };
  }

  if (!Array.isArray(glossaryData.terms)) {
    errors.push({
      field: 'terms',
      message: `Field "terms" must be an array, got ${typeof glossaryData.terms}`,
      value: glossaryData.terms,
    });

    if (throwOnError && errors.length > 0) {
      throw new GlossaryValidationError(errors);
    }

    return { valid: false, errors, data: { terms: [] } };
  }

  // Validate each term
  const validTerms: GlossaryTerm[] = [];
  glossaryData.terms.forEach((term, index) => {
    const termErrors = validateTerm(term, index);
    if (termErrors.length > 0) {
      errors.push(...termErrors);
    } else {
      // Term is valid, add to valid terms
      validTerms.push(term as GlossaryTerm);
    }
  });

  // Check for duplicate terms
  const termNames = new Map<string, number>();
  validTerms.forEach((term, index) => {
    const lowerName = term.term.toLowerCase();
    if (termNames.has(lowerName)) {
      errors.push({
        field: `terms[${index}].term`,
        message: `Duplicate term "${term.term}" (first occurrence at index ${termNames.get(lowerName)})`,
        value: term.term,
      });
    } else {
      termNames.set(lowerName, index);
    }
  });

  if (throwOnError && errors.length > 0) {
    throw new GlossaryValidationError(errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { terms: validTerms },
  };
}

/**
 * Custom error class for glossary validation errors
 * Provides detailed error messages for debugging
 */
export class GlossaryValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = formatValidationErrors(errors);
    super(message);
    this.name = 'GlossaryValidationError';
    this.errors = errors;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GlossaryValidationError);
    }
  }
}

/**
 * Formats validation errors into a readable string
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors';
  }

  const header = `Glossary validation failed with ${errors.length} error${errors.length > 1 ? 's' : ''}:`;
  const errorList = errors
    .map((err, index) => {
      let msg = `  ${index + 1}. [${err.field}] ${err.message}`;
      if (err.value !== undefined) {
        const valueStr =
          typeof err.value === 'object' ? JSON.stringify(err.value) : String(err.value);
        // Truncate long values
        const truncated = valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr;
        msg += ` (got: ${truncated})`;
      }
      return msg;
    })
    .join('\n');

  return `${header}\n${errorList}`;
}
