/**
 * SR Number Normalization and Search Matching Engine
 * Enforces canonical formatting and consistent search matching across the ERP.
 */

/**
 * Normalizes an SR number string into its canonical representation.
 * Trims whitespace and converts to uppercase.
 * e.g., " 1104 " -> "1104", "sr-1104" -> "SR-1104"
 */
export function normalizeSrNumber(sr: string | null | undefined): string {
  if (!sr) return "";
  return sr.trim().toUpperCase();
}

/**
 * Extracts just the digits from an SR number or search query if applicable.
 * e.g., "SR-1104" -> "1104", "TH/1104" -> "1104"
 */
export function extractSrDigits(sr: string | null | undefined): string {
  if (!sr) return "";
  const cleaned = sr.trim().toUpperCase();
  const digitsMatch = cleaned.match(/\d+/g);
  return digitsMatch ? digitsMatch.join("") : "";
}

/**
 * Checks if a search query is specifically an SR number query:
 * - Is purely numeric (e.g. "1104", "042")
 * - Or starts with standard SR prefixes ("SR", "SR-", "SR/", "TH/", "SCH/")
 */
export function isSrSearchQuery(query: string | null | undefined): boolean {
  if (!query) return false;
  const trimmed = query.trim().toUpperCase();
  if (!trimmed) return false;
  
  // Pure digits: 1 to 8 digits
  if (/^\d+$/.test(trimmed)) return true;
  
  // Prefix patterns like SR-1104, SR1104, TH/1104, SCH/1104
  if (/^(SR[-/ ]?|TH\/|SCH\/)\d+$/i.test(trimmed)) return true;
  
  return false;
}

/**
 * Matches a query against a student's SR number.
 * Returns:
 *  - 2 for exact match (normalized query == normalized srNumber)
 *  - 1 for partial match (sr digits match, prefix/suffix match, or contains)
 *  - 0 for no match
 */
export function matchSrScore(srNumber: string | null | undefined, query: string | null | undefined): number {
  if (!srNumber || !query) return 0;
  
  const normSr = normalizeSrNumber(srNumber);
  const normQuery = normalizeSrNumber(query);
  
  if (normSr === normQuery) return 2; // Exact match
  
  // Check digit-only exact match (e.g. query "1104" matches "SR-1104" or "TH/1104")
  const srDigits = extractSrDigits(srNumber);
  const queryDigits = extractSrDigits(query);
  if (queryDigits && srDigits === queryDigits) return 2; // Exact digit match
  
  // Prefix / Suffix / Substring match
  if (normSr.includes(normQuery) || (queryDigits && srDigits.includes(queryDigits))) {
    return 1;
  }
  
  return 0;
}
