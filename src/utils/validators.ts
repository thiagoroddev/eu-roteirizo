/**
 * Validation Helpers - Pure functions for data validation
 *
 * Easy to test and reuse across the application.
 * All functions are side-effect free.
 */

/**
 * Checks if value is neither null, undefined, nor an empty string
 * @param value - The value to check
 * @returns True if valid, false otherwise
 * @example isValidValue("Hello") → true
 * @example isValidValue("") → false
 * @example isValidValue(null) → false
 * @example isValidValue(undefined) → false
 */
export const isValidValue = (value: unknown): boolean => {
  return value !== null && value !== undefined && value !== "";
};

/**
 * Checks if value is a valid number (not NaN)
 * @param value - The value to check
 * @returns True if valid number, false otherwise
 * @example isValidNumber("123") → true
 * @example isValidNumber("abc") → false
 */
export const isValidNumber = (value: unknown): boolean => {
  if (typeof value === "number") return !isNaN(value);
  if (typeof value === "string") {
    const num = parseFloat(value);
    return !isNaN(num);
  }
  return false;
};

/** ============================================================================
 * Validates if the given file name has one of the allowed extensions
 * @param fileName - Name of the file to check
 * @param validExtensions - Array of valid extensions (e.g., [".xls", ".xlsx"])
 * @returns True if file has a valid extension, false otherwise
 * @example hasValidFileExtension("report.xls", [".xls", ".xlsx"]) → true
 */
export const hasValidFileExtension = (fileName: string, validExtensions: readonly string[]): boolean => {
  const lowerCaseFileName = fileName.toLowerCase();
  return validExtensions.some((ext) => lowerCaseFileName.endsWith(ext));
};
