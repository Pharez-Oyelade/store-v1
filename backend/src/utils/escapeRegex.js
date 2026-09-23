/**
 * Escapes special characters in a string for safe use in MongoDB $regex queries.
 * Prevents regex syntax errors and ReDoS (Regular Expression Denial of Service).
 *
 * @param {string} str - Raw user search input
 * @returns {string} Regex-escaped string
 */
export function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default escapeRegex;
