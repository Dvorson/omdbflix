import { validateYearParameter } from '../utils/validation';

describe('Year Parameter Validation', () => {
  test('should accept valid 4-digit years', () => {
    expect(validateYearParameter('2020')).toBe(true);
    expect(validateYearParameter('1999')).toBe(true);
    expect(validateYearParameter('2024')).toBe(true);
  });

  test('should reject non-numeric values', () => {
    expect(validateYearParameter('Cuts')).toBe(false);
    expect(validateYearParameter('Director\'s Cut')).toBe(false);
    expect(validateYearParameter('Special Edition')).toBe(false);
  });

  test('should reject invalid year formats', () => {
    expect(validateYearParameter('20')).toBe(false);
    expect(validateYearParameter('10000')).toBe(false);
    expect(validateYearParameter('202')).toBe(false);
    expect(validateYearParameter('abcd')).toBe(false);
  });

  test('should reject empty values', () => {
    expect(validateYearParameter('')).toBe(false);
    expect(validateYearParameter(null)).toBe(false);
    expect(validateYearParameter(undefined)).toBe(false);
  });
}); 