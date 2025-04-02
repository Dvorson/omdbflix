/**
 * Validates if a year parameter is valid for use in database queries
 * @param year The year value to validate
 * @returns true if the year is valid, false otherwise
 */
export function validateYearParameter(year: string | null | undefined): boolean {
  // Return false for null, undefined, or empty strings
  if (!year) {
    return false;
  }
  
  // Check if year is exactly a 4-digit number format
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(year)) {
    return false;
  }
  
  // Validate year range (1900 to current year + 5)
  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (yearNum < 1900 || yearNum > currentYear + 5) {
    return false;
  }
  
  return true;
} 