import prisma from "@/lib/prisma";

export type StandardTermKey = "ut1" | "halfYearly" | "ut2" | "annual";

/**
 * Normalizes varied exam type strings into standard term keys for dynamic report card column mapping.
 */
export function mapExamTypeToTermKey(examType: string): StandardTermKey | null {
  if (!examType) return null;
  const clean = examType.trim().toUpperCase();

  // Unit Test 1 / Assessment 1 / Term 1
  if (
    clean === "UT1" ||
    clean === "UT 1" ||
    clean === "UNIT TEST 1" ||
    clean === "UNIT TEST-1" ||
    clean === "UNIT TEST - 1" ||
    clean === "ASSESSMENT 1" ||
    clean === "ASSESSMENT-1" ||
    clean === "ASS 1" ||
    clean === "ASS1" ||
    clean === "TERM 1" ||
    clean === "TERM I" ||
    clean === "TERM-1" ||
    clean === "TERM-I"
  ) {
    return "ut1";
  }

  // Half Yearly / Mid Term / Term 2
  if (
    clean === "HALF YEARLY" ||
    clean === "HALF-YEARLY" ||
    clean === "HALFYEARLY" ||
    clean === "HY" ||
    clean === "MID TERM" ||
    clean === "MID-TERM" ||
    clean === "TERM 2" ||
    clean === "TERM II" ||
    clean === "TERM-2" ||
    clean === "TERM-II"
  ) {
    return "halfYearly";
  }

  // Unit Test 2 / Assessment 2 / Term 3
  if (
    clean === "UT2" ||
    clean === "UT 2" ||
    clean === "UNIT TEST 2" ||
    clean === "UNIT TEST-2" ||
    clean === "UNIT TEST - 2" ||
    clean === "ASSESSMENT 2" ||
    clean === "ASSESSMENT-2" ||
    clean === "ASS 2" ||
    clean === "ASS2" ||
    clean === "TERM 3" ||
    clean === "TERM III" ||
    clean === "TERM-3" ||
    clean === "TERM-III"
  ) {
    return "ut2";
  }

  // Annual Exam / Final / Term 4
  if (
    clean === "ANNUAL" ||
    clean === "ANNUAL EXAM" ||
    clean === "ANNUAL-EXAM" ||
    clean === "FINAL" ||
    clean === "FINAL EXAM" ||
    clean === "YEARLY" ||
    clean === "TERM 4" ||
    clean === "TERM IV" ||
    clean === "TERM-4" ||
    clean === "TERM-IV"
  ) {
    return "annual";
  }

  // Substring matching as fallback
  if (clean.includes("UT1") || clean.includes("TEST 1") || clean.includes("ASSESSMENT 1") || clean.includes("TERM 1")) return "ut1";
  if (clean.includes("HALF") || clean.includes("HY") || clean.includes("MID") || clean.includes("TERM 2")) return "halfYearly";
  if (clean.includes("UT2") || clean.includes("TEST 2") || clean.includes("ASSESSMENT 2") || clean.includes("TERM 3")) return "ut2";
  if (clean.includes("ANNUAL") || clean.includes("FINAL") || clean.includes("YEARLY") || clean.includes("TERM 4")) return "annual";

  return null;
}

/**
 * Standardizes human-readable exam names for database storage.
 */
export function normalizeCanonicalExamType(examType: string): string {
  const termKey = mapExamTypeToTermKey(examType);
  switch (termKey) {
    case "ut1":
      return "Unit Test 1";
    case "halfYearly":
      return "Half Yearly";
    case "ut2":
      return "Unit Test 2";
    case "annual":
      return "Annual";
    default:
      return examType.trim();
  }
}

/**
 * Calculates standard letter grade from percentage (CBSE/ICSE scale).
 */
export function calculateGradeFromPercentage(percentage: number): string {
  if (isNaN(percentage) || percentage === null || percentage === undefined) return "—";
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  if (percentage >= 21) return "E1";
  return "E2";
}

/**
 * Calculates letter grade from marks obtained and max marks.
 */
export function calculateGradeFromScore(
  obtained: number | string | null | undefined,
  max: number | string | null | undefined
): string {
  if (obtained === null || obtained === undefined || obtained === "") return "";
  const numObtained = typeof obtained === "number" ? obtained : parseFloat(String(obtained));
  const numMax = typeof max === "number" ? max : parseFloat(String(max || 100));

  if (isNaN(numObtained) || isNaN(numMax) || numMax <= 0) return "";
  const pct = (numObtained / numMax) * 100;
  return calculateGradeFromPercentage(pct);
}

/**
 * Maps raw database subject names (e.g., "Maths", "English", "History", "G.K")
 * to the exact target subject names used in a specific report card template.
 */
export function resolveCanonicalSubject(rawSubj: string, targetSubjects: string[]): string {
  if (!rawSubj) return "";
  const cleanRaw = rawSubj.trim();
  const lowerRaw = cleanRaw.toLowerCase();

  // 1. Direct exact or case-insensitive match
  const exact = targetSubjects.find((s) => s.toLowerCase() === lowerRaw);
  if (exact) return exact;

  // 2. Specialized Aliases for Mid-Levels & Class IX
  if (lowerRaw === "english" || lowerRaw === "eng") {
    const lit = targetSubjects.find((s) => s.toLowerCase().includes("english lit") || s.toLowerCase() === "english");
    if (lit) return lit;
  }
  if (lowerRaw === "hindi" || lowerRaw === "hin") {
    const lit = targetSubjects.find((s) => s.toLowerCase().includes("hindi lit") || s.toLowerCase() === "hindi");
    if (lit) return lit;
  }
  if (lowerRaw === "maths" || lowerRaw === "math" || lowerRaw === "mathematics" || lowerRaw === "maths logic") {
    const m = targetSubjects.find((s) => s.toLowerCase() === "mathematics" || s.toLowerCase() === "maths/home science" || s.toLowerCase() === "mathematics- i");
    if (m) return m;
  }
  if (lowerRaw === "maths-i" || lowerRaw === "maths-1" || lowerRaw === "math-i") {
    const m = targetSubjects.find((s) => s.toLowerCase().includes("mathematics- i") || s.toLowerCase().includes("maths-i"));
    if (m) return m;
  }
  if (lowerRaw === "maths-ii" || lowerRaw === "maths-2" || lowerRaw === "math-ii") {
    const m = targetSubjects.find((s) => s.toLowerCase().includes("mathematics- ii") || s.toLowerCase().includes("maths-ii"));
    if (m) return m;
  }
  if (lowerRaw === "history" || lowerRaw === "hist") {
    const h = targetSubjects.find((s) => s.toLowerCase().includes("history") || s.toLowerCase() === "social science");
    if (h) return h;
  }
  if (lowerRaw === "geography" || lowerRaw === "geo") {
    const g = targetSubjects.find((s) => s.toLowerCase().includes("geography") || s.toLowerCase() === "social science");
    if (g) return g;
  }
  if (lowerRaw === "science" || lowerRaw === "gen sci") {
    const sc = targetSubjects.find((s) => s.toLowerCase() === "science");
    if (sc) return sc;
  }
  if (lowerRaw === "g.k" || lowerRaw === "gk" || lowerRaw === "g.k." || lowerRaw === "general knowledge") {
    const gk = targetSubjects.find((s) => s.toLowerCase().includes("knowledge") || s.toLowerCase().includes("g.k"));
    if (gk) return gk;
  }
  if (lowerRaw === "sanskrit" || lowerRaw === "sans" || lowerRaw === "skt") {
    const sk = targetSubjects.find((s) => s.toLowerCase().includes("sanskrit"));
    if (sk) return sk;
  }
  if (lowerRaw === "computer" || lowerRaw === "computers" || lowerRaw === "it") {
    const cp = targetSubjects.find((s) => s.toLowerCase().includes("computer"));
    if (cp) return cp;
  }

  // 3. Substring matching fallback
  const sub = targetSubjects.find(
    (s) => s.toLowerCase().includes(lowerRaw) || lowerRaw.includes(s.toLowerCase())
  );
  if (sub) return sub;

  return cleanRaw;
}

export interface LiveSubjectMarkRow {
  ut1?: number | string;
  halfYearly?: number | string;
  ut2?: number | string;
  annual?: number | string;
  grandTotal?: number | string;
  grade?: string;
}

/**
 * Fetches all live marks for a student across their active sessions,
 * mapping all exam terms and resolving subject aliases dynamically.
 */
export async function fetchLiveSubjectMarks(
  studentSrNumber: string,
  targetSubjects: string[],
  academicSessionId?: string
): Promise<Record<string, LiveSubjectMarkRow>> {
  const cleanSr = studentSrNumber.trim().toUpperCase();

  // Query marks belonging to this student across their active session(s)
  const marks = await prisma.mark.findMany({
    where: {
      academicSession: {
        studentSrNumber: cleanSr,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const subjectMap: Record<string, LiveSubjectMarkRow> = {};

  // Initialize with target subjects
  targetSubjects.forEach((subj) => {
    subjectMap[subj] = {
      ut1: "",
      halfYearly: "",
      ut2: "",
      annual: "",
      grandTotal: "",
      grade: "",
    };
  });

  // Overlay database marks using smart canonical subject resolution
  marks.forEach((mark) => {
    const resolvedSubject = resolveCanonicalSubject(mark.subjectName, targetSubjects);
    if (!resolvedSubject) return;

    if (!subjectMap[resolvedSubject]) {
      subjectMap[resolvedSubject] = {
        ut1: "",
        halfYearly: "",
        ut2: "",
        annual: "",
        grandTotal: "",
        grade: mark.grade || "",
      };
    }

    const termKey = mapExamTypeToTermKey(mark.examType);
    const score =
      mark.totalMarksObtained ??
      (mark.writtenMarksObtained !== null && mark.writtenMarksObtained !== undefined
        ? mark.writtenMarksObtained + (mark.oralMarksObtained || 0)
        : undefined);

    if (termKey && score !== undefined && score !== null) {
      // Don't overwrite if already populated by a newer session mark
      if (subjectMap[resolvedSubject][termKey] === "" || subjectMap[resolvedSubject][termKey] === undefined) {
        subjectMap[resolvedSubject][termKey] = score;
      }
    }

    if (mark.grade && (!subjectMap[resolvedSubject].grade || subjectMap[resolvedSubject].grade === "")) {
      subjectMap[resolvedSubject].grade = mark.grade;
    }
  });

  return subjectMap;
}

/**
 * Fetches all live soft skills / project grades / co-scholastic activities for a student.
 */
export async function fetchLiveSoftSkills(
  studentSrNumber: string
): Promise<Array<{ skillName: string; term: string; grade: string; remarks: string | null }>> {
  const cleanSr = studentSrNumber.trim().toUpperCase();

  return await prisma.softSkill.findMany({
    where: {
      academicSession: {
        studentSrNumber: cleanSr,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
