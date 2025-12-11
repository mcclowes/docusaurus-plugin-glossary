import {
  validateGlossaryData,
  GlossaryValidationError,
  formatValidationErrors,
} from '../src/validation.js';

describe('validateGlossaryData', () => {
  describe('valid data', () => {
    it('should validate a correct glossary structure', () => {
      const data = {
        terms: [
          { term: 'API', definition: 'Application Programming Interface' },
          { term: 'SDK', definition: 'Software Development Kit' },
        ],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data.terms).toHaveLength(2);
    });

    it('should accept terms with optional fields', () => {
      const data = {
        terms: [
          {
            term: 'API',
            definition: 'Application Programming Interface',
            abbreviation: 'API',
            relatedTerms: ['SDK', 'REST'],
            id: 'api-term',
          },
        ],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept empty terms array', () => {
      const data = { terms: [] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data.terms).toHaveLength(0);
    });
  });

  describe('invalid root structure', () => {
    it('should reject null data', () => {
      const result = validateGlossaryData(null, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].message).toContain('null or undefined');
    });

    it('should reject undefined data', () => {
      const result = validateGlossaryData(undefined, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
    });

    it('should reject non-object data', () => {
      const result = validateGlossaryData('string', { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should reject data without terms field', () => {
      const result = validateGlossaryData({}, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('terms');
      expect(result.errors[0].message).toContain('must contain a "terms" array');
    });

    it('should reject non-array terms field', () => {
      const result = validateGlossaryData({ terms: 'not-array' }, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be an array');
    });
  });

  describe('invalid term objects', () => {
    it('should reject null term', () => {
      const data = { terms: [null] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0]');
      expect(result.errors[0].message).toContain('null or undefined');
    });

    it('should reject non-object term', () => {
      const data = { terms: ['string'] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should reject term without term field', () => {
      const data = { terms: [{ definition: 'Some definition' }] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].term');
      expect(result.errors[0].message).toContain('Missing required field');
    });

    it('should reject term with non-string term field', () => {
      const data = { terms: [{ term: 123, definition: 'Some definition' }] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be a string');
    });

    it('should reject term with empty term field', () => {
      const data = { terms: [{ term: '   ', definition: 'Some definition' }] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('cannot be empty');
    });

    it('should reject term without definition field', () => {
      const data = { terms: [{ term: 'API' }] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].definition');
    });

    it('should reject term with non-string definition', () => {
      const data = { terms: [{ term: 'API', definition: 123 }] };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be a string');
    });
  });

  describe('optional field validation', () => {
    it('should reject non-string abbreviation', () => {
      const data = {
        terms: [{ term: 'API', definition: 'Test', abbreviation: 123 }],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].abbreviation');
    });

    it('should reject non-array relatedTerms', () => {
      const data = {
        terms: [{ term: 'API', definition: 'Test', relatedTerms: 'SDK' }],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].relatedTerms');
    });

    it('should reject non-string items in relatedTerms', () => {
      const data = {
        terms: [{ term: 'API', definition: 'Test', relatedTerms: ['SDK', 123] }],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].relatedTerms[1]');
    });

    it('should reject non-string id', () => {
      const data = {
        terms: [{ term: 'API', definition: 'Test', id: 123 }],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('terms[0].id');
    });
  });

  describe('duplicate detection', () => {
    it('should detect duplicate terms (case-insensitive)', () => {
      const data = {
        terms: [
          { term: 'API', definition: 'First definition' },
          { term: 'api', definition: 'Second definition' },
        ],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate term'))).toBe(true);
    });
  });

  describe('throwOnError option', () => {
    it('should throw GlossaryValidationError when throwOnError is true', () => {
      const data = { terms: 'invalid' };

      expect(() => validateGlossaryData(data, { throwOnError: true })).toThrow(
        GlossaryValidationError
      );
    });

    it('should throw by default', () => {
      const data = { terms: 'invalid' };

      expect(() => validateGlossaryData(data)).toThrow(GlossaryValidationError);
    });

    it('should not throw when throwOnError is false', () => {
      const data = { terms: 'invalid' };

      expect(() => validateGlossaryData(data, { throwOnError: false })).not.toThrow();
    });
  });

  describe('partial validation', () => {
    it('should return valid terms even when some are invalid', () => {
      const data = {
        terms: [
          { term: 'API', definition: 'Valid term' },
          { term: '', definition: 'Invalid - empty term' },
          { term: 'SDK', definition: 'Another valid term' },
        ],
      };

      const result = validateGlossaryData(data, { throwOnError: false });

      expect(result.valid).toBe(false);
      expect(result.data.terms).toHaveLength(2);
      expect(result.data.terms[0].term).toBe('API');
      expect(result.data.terms[1].term).toBe('SDK');
    });
  });
});

describe('GlossaryValidationError', () => {
  it('should have correct name', () => {
    const error = new GlossaryValidationError([]);
    expect(error.name).toBe('GlossaryValidationError');
  });

  it('should contain errors array', () => {
    const errors = [{ field: 'test', message: 'Test error' }];
    const error = new GlossaryValidationError(errors);

    expect(error.errors).toEqual(errors);
  });

  it('should format error message correctly', () => {
    const errors = [
      { field: 'terms[0].term', message: 'Missing required field "term"' },
    ];
    const error = new GlossaryValidationError(errors);

    expect(error.message).toContain('1 error');
    expect(error.message).toContain('terms[0].term');
  });
});

describe('formatValidationErrors', () => {
  it('should return "No validation errors" for empty array', () => {
    expect(formatValidationErrors([])).toBe('No validation errors');
  });

  it('should format single error correctly', () => {
    const errors = [{ field: 'terms', message: 'Must be an array' }];
    const result = formatValidationErrors(errors);

    expect(result).toContain('1 error');
    expect(result).toContain('[terms]');
    expect(result).toContain('Must be an array');
  });

  it('should format multiple errors with plural', () => {
    const errors = [
      { field: 'terms[0].term', message: 'Missing field' },
      { field: 'terms[1].definition', message: 'Missing field' },
    ];
    const result = formatValidationErrors(errors);

    expect(result).toContain('2 errors');
  });

  it('should include truncated value when present', () => {
    const errors = [
      { field: 'terms', message: 'Wrong type', value: 'short' },
    ];
    const result = formatValidationErrors(errors);

    expect(result).toContain('(got: short)');
  });

  it('should truncate long values', () => {
    const longValue = 'a'.repeat(100);
    const errors = [
      { field: 'terms', message: 'Wrong type', value: longValue },
    ];
    const result = formatValidationErrors(errors);

    expect(result).toContain('...');
    expect(result.length).toBeLessThan(longValue.length + 100);
  });
});
