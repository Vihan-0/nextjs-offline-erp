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

// ========================================================
// STRICT REPORT CARD ROUTE MAPPING (Task 3)
// ========================================================

/** Exact-match sets for strict pre-primary class separation. */
const PRE_PRIMARY_NURSERY = new Set(["NURSERY - PP3", "NURSERY", "PP3"]);
const PRE_PRIMARY_LKG = new Set(["LKG - PP2", "LKG", "PP2", "L.K.G", "L.K.G."]);
const PRE_PRIMARY_UKG = new Set(["UKG - PP1", "UKG", "PP1", "U.K.G", "U.K.G."]);

const MID_LEVELS = new Set(["CLASS 6", "CLASS VI", "CLASS 7", "CLASS VII", "CLASS 8", "CLASS VIII", "CLASS 6", "CLASS 7", "CLASS 8", "CLASS-6", "CLASS-7", "CLASS-8"]);
const SECONDARY = new Set(["CLASS 9", "CLASS IX", "CLASS 10", "CLASS X", "CLASS-9", "CLASS-10"]);

// Build the sets from the hierarchy for mid/secondary
for (let i = 6; i <= 8; i++) {
  MID_LEVELS.add(`CLASS ${i}`);
  MID_LEVELS.add(`CLASS ${toRoman(i)}`);
  MID_LEVELS.add(`Class ${i}`);
}
for (let i = 9; i <= 10; i++) {
  SECONDARY.add(`CLASS ${i}`);
  SECONDARY.add(`CLASS ${toRoman(i)}`);
  SECONDARY.add(`Class ${i}`);
}

export interface ReportCardRouteInfo {
  route: string;
  label: string;
  badge: string;
  color: string;
}

/**
 * Strict exact-match report card route resolver.
 * No substring matching — each pre-primary level maps independently.
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

  // Mid-Levels (VI–VIII)
  if (MID_LEVELS.has(norm)) {
    return {
      route: "mid-levels",
      label: "Junior Wing Progress Card (VI–VIII)",
      badge: "Junior Section",
      color: "bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60",
    };
  }

  // Secondary (IX–X)
  if (SECONDARY.has(norm)) {
    return {
      route: "class-ix",
      label: "Secondary Progress Card (IX–X)",
      badge: "Secondary Board Standard",
      color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/60",
    };
  }

  // Default: Lower Primary (I–V)
  return {
    route: "lower-primary",
    label: "Lower Primary Holistic Card (I–V)",
    badge: "Primary Wing",
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
