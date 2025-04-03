console.log('>>> Loading module: utils/validation.js');

/**
 * Validates if a year parameter is valid for use in database queries or API calls
 * @param {string | null | undefined} year The year value to validate
 * @returns {boolean} true if the year is valid, false otherwise
 */
export function validateYearParameter(year) {
  // Return false for null, undefined, or empty strings
  if (!year || typeof year !== 'string') {
    return false;
  }

  // Check if year is exactly a 4-digit number format
  const yearRegex = /^\d{4}$/;
  if (!yearRegex.test(year)) {
    return false;
  }

  // Validate year range (1900 to current year + 5)
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) {
      return false; // Should not happen with regex, but good practice
  }
  const currentYear = new Date().getFullYear();
  if (yearNum < 1900 || yearNum > currentYear + 5) {
    return false;
  }

  return true;
}

// Add other validation helpers here if needed 