/**
 * Master Class Hierarchy & Utilities
 *
 * Central source of truth for the school's class progression order,
 * automatic currentClass calculation from backdated admissions,
 * and strict class-to-report-card route mapping.
 */

// ========================================================
// MASTER CLASS HIERARCHY (Ordered: Nursery → Class 12)
// ========================================================

export const MASTER_CLASS_HIERARCHY = [
  "Nursery - PP3",
  "LKG - PP2",
  "UKG - PP1",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
] as const;

export type MasterClassName = (typeof MASTER_CLASS_HIERARCHY)[number];

/**
 * Normalization map: maps any legacy or variant class string to
 * its canonical MASTER_CLASS_HIERARCHY index.
 *
 * This ensures backward compatibility with existing DB records
 * that store "NURSERY", "LKG", "UKG", "CLASS I", etc.
 */
const CLASS_NAME_TO_INDEX: Record<string, number> = {};

// Build the normalization map
function addVariants(index: number, ...variants: string[]) {
  for (const v of variants) {
    CLASS_NAME_TO_INDEX[v.toUpperCase().trim()] = index;
  }
}

// Index 0: Nursery - PP3
addVariants(0, "Nursery - PP3", "NURSERY - PP3", "NURSERY", "PP3", "PRE-PRIMARY 3", "PRE PRIMARY 3");
// Index 1: LKG - PP2
addVariants(1, "LKG - PP2", "LKG", "PP2", "L.K.G", "L.K.G.", "LOWER KG", "LOWER KINDERGARTEN", "PRE-PRIMARY 2", "PRE PRIMARY 2");
// Index 2: UKG - PP1
addVariants(2, "UKG - PP1", "UKG", "PP1", "U.K.G", "U.K.G.", "UPPER KG", "UPPER KINDERGARTEN", "PRE-PRIMARY 1", "PRE PRIMARY 1");
// Index 3-14: Class 1 through Class 12
for (let i = 1; i <= 12; i++) {
  const idx = i + 2; // offset by pre-primary count
  const roman = toRoman(i);
  addVariants(
    idx,
    `Class ${i}`,
    `CLASS ${i}`,
    `CLASS ${roman}`,
    `CLASS-${i}`,
    `CLASS-${roman}`,
    `${i}`,
    `${roman}`,
    `STD ${i}`,
    `STD ${roman}`,
    `STANDARD ${i}`,
    `STANDARD ${roman}`
  );
}

/** Simple integer to Roman numeral (1-12 range). */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, numeral] of map) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}

// ========================================================
// CURRENT CLASS CALCULATION (Backdated Admissions)
// ========================================================

/**
 * Extract the start year from a session string.
 * Supports both "2023-2024" and "2023-24" formats.
 */
export function parseSessionStartYear(session: string): number | null {
  if (!session) return null;
  const clean = session.trim();

  // Try "YYYY-YYYY" or "YYYY-YY"
  const match = clean.match(/^(\d{4})\s*[-–]\s*\d{2,4}$/);
  if (match) return parseInt(match[1], 10);

  // Try just "YYYY"
  const yearMatch = clean.match(/^(\d{4})$/);
  if (yearMatch) return parseInt(yearMatch[1], 10);

  return null;
}

/**
 * Normalizes any session format into canonical "YYYY-YYYY" format.
 * Examples:
 *   "2026-27"   -> "2026-2027"
 *   "2026-2027" -> "2026-2027"
 *   "2026/27"   -> "2026-2027"
 *   "2026"      -> "2026-2027"
 */
export function normalizeSessionYear(session?: string | null): string {
  if (!session || typeof session !== "string") return CURRENT_SESSION;
  const clean = session.trim();
  const start = parseSessionStartYear(clean);
  if (!start) return clean || CURRENT_SESSION;
  return `${start}-${start + 1}`;
}

/**
 * Compares two session strings for equivalence regardless of formatting ("2026-27" === "2026-2027").
 */
export function areSessionsEqual(s1?: string | null, s2?: string | null): boolean {
  if (!s1 || !s2) return false;
  return normalizeSessionYear(s1) === normalizeSessionYear(s2);
}

/**
 * Resolves any class name variant to its canonical index in MASTER_CLASS_HIERARCHY.
 * Returns -1 if not recognized.
 */
export function resolveClassIndex(className: string): number {
  if (!className) return -1;
  const key = className.toUpperCase().trim();
  return CLASS_NAME_TO_INDEX[key] ?? -1;
}

/**
 * Resolves any class name variant to its canonical MASTER_CLASS_HIERARCHY name.
 * Returns the input unchanged if not recognized.
 */
export function resolveCanonicalClassName(className: string): string {
  const idx = resolveClassIndex(className);
  if (idx >= 0 && idx < MASTER_CLASS_HIERARCHY.length) {
    return MASTER_CLASS_HIERARCHY[idx];
  }
  return className; // Fallback: return as-is
}

/**
 * Calculates the current class based on admission class, admission session,
 * and current active session, advancing through the master hierarchy.
 *
 * Example:
 *   admissionClass = "Nursery - PP3"
 *   admissionSession = "2023-2024"
 *   currentSession = "2026-2027"
 *   gap = 3 years → Nursery(0) + 3 = index 3 → "Class 1"
 */
export function calculateCurrentClass(
  admissionClass: string,
  admissionSession: string,
  currentSession: string
): string {
  const admissionIndex = resolveClassIndex(admissionClass);
  if (admissionIndex < 0) {
    // Unrecognized class — return the admission class as-is
    return admissionClass;
  }

  const admissionYear = parseSessionStartYear(admissionSession);
  const currentYear = parseSessionStartYear(currentSession);

  if (admissionYear === null || currentYear === null) {
    // Can't compute gap — return admission class
    return MASTER_CLASS_HIERARCHY[admissionIndex];
  }

  const gap = currentYear - admissionYear;
  if (gap <= 0) {
    // Same year or future — no advancement
    return MASTER_CLASS_HIERARCHY[admissionIndex];
  }

  // Advance through hierarchy, cap at Class 12 (last index)
  const newIndex = Math.min(admissionIndex + gap, MASTER_CLASS_HIERARCHY.length - 1);
  return MASTER_CLASS_HIERARCHY[newIndex];
}

/**
 * Generates an array of all sessions (including intermediate years) from the admission session
 * up to the current session, incrementing the class according to the hierarchy.
 * Returns an array of objects { sessionYear: string, className: string }.
 */
export function generateIntermediateSessions(
  admissionClass: string,
  admissionSession: string,
  currentSession: string
): Array<{ sessionYear: string; className: string }> {
  const admissionIndex = resolveClassIndex(admissionClass);
  if (admissionIndex < 0) {
    // Unrecognized class — just return the admission session
    return [{ sessionYear: admissionSession, className: admissionClass }];
  }

  const admissionYear = parseSessionStartYear(admissionSession);
  const currentYear = parseSessionStartYear(currentSession);

  if (admissionYear === null || currentYear === null) {
    return [{ sessionYear: admissionSession, className: MASTER_CLASS_HIERARCHY[admissionIndex] }];
  }

  const gap = currentYear - admissionYear;
  if (gap <= 0) {
    return [{ sessionYear: admissionSession, className: MASTER_CLASS_HIERARCHY[admissionIndex] }];
  }

  const sessions: Array<{ sessionYear: string; className: string }> = [];
  
  // Loop from admission year to current year (inclusive)
  for (let i = 0; i <= gap; i++) {
    const yearStart = admissionYear + i;
    const yearEnd = yearStart + 1;
    const sessionString = `${yearStart}-${yearEnd}`;
    
    const index = Math.min(admissionIndex + i, MASTER_CLASS_HIERARCHY.length - 1);
    const cls = MASTER_CLASS_HIERARCHY[index];
    
    sessions.push({ sessionYear: sessionString, className: cls });
  }

  return sessions;
}

// ========================================================
// STRICT REPORT CARD ROUTE MAPPING (Task 3)
// ========================================================

/** Exact-match sets for strict pre-primary class separation. */
const PRE_PRIMARY_NURSERY = new Set(["NURSERY - PP3", "NURSERY", "PP3"]);
const PRE_PRIMARY_LKG = new Set(["LKG - PP2", "LKG", "PP2", "L.K.G", "L.K.G."]);
const PRE_PRIMARY_UKG = new Set(["UKG - PP1", "UKG", "PP1", "U.K.G", "U.K.G."]);

const MID_LEVELS = new Set<string>();
const SECONDARY = new Set<string>();

// Build the sets from the hierarchy:
// Mid-Levels: Class 3 through Class 8 (Classes III–VIII)
for (let i = 3; i <= 8; i++) {
  const roman = toRoman(i);
  MID_LEVELS.add(`CLASS ${i}`);
  MID_LEVELS.add(`CLASS ${roman}`);
  MID_LEVELS.add(`Class ${i}`);
  MID_LEVELS.add(`CLASS-${i}`);
  MID_LEVELS.add(`CLASS-${roman}`);
  MID_LEVELS.add(`${i}`);
  MID_LEVELS.add(roman);
}

// Secondary & Senior Secondary: Class 9 through Class 12 (Classes IX–XII)
for (let i = 9; i <= 12; i++) {
  const roman = toRoman(i);
  SECONDARY.add(`CLASS ${i}`);
  SECONDARY.add(`CLASS ${roman}`);
  SECONDARY.add(`Class ${i}`);
  SECONDARY.add(`CLASS-${i}`);
  SECONDARY.add(`CLASS-${roman}`);
  SECONDARY.add(`${i}`);
  SECONDARY.add(roman);
}

export interface ReportCardRouteInfo {
  route: string;
  label: string;
  badge: string;
  color: string;
}

/**
 * Standard Letter Grade Converter for Classes up to Class 2 (Nursery to Class 2).
 * Brackets: 91-100% = A+, 81-90% = A, 71-80% = B+, 61-70% = B, 51-60% = C+, 41-50% = C, 33-40% = D, <33% = E
 */
export function convertScoreOrGradeToLetterGrade(
  value: string | number | null | undefined,
  maxMarks: number = 100
): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value).trim();
  if (!str) return "";

  const upper = str.toUpperCase();
  if (["A+", "A", "B+", "B", "C+", "C", "D", "E"].includes(upper)) {
    return upper;
  }
  if (upper === "A1") return "A+";
  if (upper === "A2") return "A";
  if (upper === "B1") return "B+";
  if (upper === "B2") return "B";
  if (upper === "C1") return "C+";
  if (upper === "C2") return "C";
  if (upper === "D1" || upper === "D2") return "D";
  if (upper === "E1" || upper === "E2") return "E";

  const num = typeof value === "number" ? value : parseFloat(str);
  if (!isNaN(num)) {
    const max = maxMarks > 0 ? maxMarks : 100;
    const pct = (num / max) * 100;
    if (pct >= 91) return "A+";
    if (pct >= 81) return "A";
    if (pct >= 71) return "B+";
    if (pct >= 61) return "B";
    if (pct >= 51) return "C+";
    if (pct >= 41) return "C";
    if (pct >= 33) return "D";
    return "E";
  }

  return str;
}

/**
 * Normalizes exam/term names to canonical 4-term keys: "term1" | "term2" | "term3" | "term4".
 * Handles Term 1/I/UT1, Term 2/II/Half Yearly, Term 3/III/UT3, Term 4/IV/Annual.
 * Order of evaluation protects against "I" matching in "II", "III", and "IV".
 */
export function normalizeTermKey(examType: string | null | undefined): "term1" | "term2" | "term3" | "term4" | null {
  if (!examType) return null;
  const t = examType.trim().toUpperCase();
  // Check Term 4 / IV / Annual
  if (t === "IV" || t === "TERM 4" || t === "TERM IV" || t === "ANNUAL" || t === "FINAL" || t === "T4" || /\b(iv|4|annual|final)\b/i.test(t)) {
    return "term4";
  }
  // Check Term 3 / III / UT 3
  if (t === "III" || t === "TERM 3" || t === "TERM III" || t === "UT3" || t === "T3" || /\b(iii|3)\b/i.test(t)) {
    return "term3";
  }
  // Check Term 2 / II / Half Yearly / UT 2
  if (t === "II" || t === "TERM 2" || t === "TERM II" || t === "HALF" || t === "HALF YEARLY" || t === "HALF-YEARLY" || t === "HY" || t === "T2" || /\b(ii|2|half)\b/i.test(t)) {
    return "term2";
  }
  // Check Term 1 / I / UT 1
  if (t === "I" || t === "TERM 1" || t === "TERM I" || t === "UT1" || t === "T1" || /\b(i|1)\b/i.test(t)) {
    return "term1";
  }
  return null;
}

/**
 * Strict exact-match report card route resolver.
 * Pre-Primary: Nursery, LKG, UKG -> pre-primary
 * Lower Primary: Class 1, Class 2 -> lower-primary (Grades only on Card)
 * Upper Primary & Junior: Class 3 to Class 8 -> mid-levels (Numeric marks & grand totals)
 * Secondary: Class 9 to Class 12 -> class-ix (Numeric marks & grand totals)
 */
export function getReportCardRouteForClass(className: string): ReportCardRouteInfo {
  const norm = (className || "").toUpperCase().trim();

  // Strict Pre-Primary: each level is independent
  if (PRE_PRIMARY_NURSERY.has(norm) || PRE_PRIMARY_LKG.has(norm) || PRE_PRIMARY_UKG.has(norm)) {
    return {
      route: "pre-primary",
      label: "Pre-Primary Foundation Card",
      badge: "Early Childhood (4-Term)",
      color: "bg-rose-950/60 text-rose-300 border-rose-800/60 hover:bg-rose-900/60",
    };
  }

  // Mid-Levels (Class 3 to Class 8 / III–VIII)
  if (MID_LEVELS.has(norm)) {
    return {
      route: "mid-levels",
      label: "Junior Wing Progress Card (III–VIII)",
      badge: "Upper Primary & Junior Section",
      color: "bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60",
    };
  }

  // Secondary (Class 9 to Class 12 / IX–XII)
  if (SECONDARY.has(norm)) {
    return {
      route: "class-ix",
      label: "Secondary Progress Card (IX–XII)",
      badge: "Secondary Board Standard",
      color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/60",
    };
  }

  // Default: Lower Primary (Class 1 & Class 2 / I–II)
  return {
    route: "lower-primary",
    label: "Lower Primary Holistic Card (I–II)",
    badge: "Primary Wing (Grades)",
    color: "bg-blue-950/60 text-blue-300 border-blue-800/60 hover:bg-blue-900/60",
  };
}

/**
 * Strict report card path resolver (compact version for directory table).
 */
export function getReportCardPathForClass(className: string): {
  path: string;
  label: string;
  color: string;
} {
  const info = getReportCardRouteForClass(className);
  const labelMap: Record<string, string> = {
    "pre-primary": "Pre-Prim",
    "mid-levels": "Junior Card",
    "class-ix": "Class IX Card",
    "lower-primary": "Primary Card",
  };
  return {
    path: info.route,
    label: labelMap[info.route] || "Card",
    color: info.color,
  };
}

/**
 * Checks if a given class name is strictly a pre-primary class.
 * Uses exact matching, not substring.
 */
export function isPrePrimaryClass(className: string): boolean {
  const norm = (className || "").toUpperCase().trim();
  return PRE_PRIMARY_NURSERY.has(norm) || PRE_PRIMARY_LKG.has(norm) || PRE_PRIMARY_UKG.has(norm);
}

/** Current active session constant. */
export const CURRENT_SESSION = "2026-2027";
