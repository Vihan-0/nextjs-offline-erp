"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";

export interface MarkItemPayload {
  subjectName: string;
  examType: string;
  oralMarksObtained?: number | null;
  oralMaxMarks?: number | null;
  writtenMarksObtained?: number | null;
  writtenMaxMarks?: number | null;
  totalMarksObtained?: number | null;
  totalMaxMarks?: number | null;
  grade?: string | null;
}

export interface SoftSkillItemPayload {
  skillName: string;
  term: string;
  grade: string;
  remarks?: string | null;
}

export interface StudentAccumulativeEntry {
  srNumber: string;
  rollNumber?: string;
  bloodGroup?: string;
  height?: string;
  weight?: string;
  distanceFromSchool?: number | null;
  fatherQualification?: string;
  motherQualification?: string;
  resultStatus?: string;
  attendancePresent?: number | null;
  attendanceTotal?: number | null;
  marks: MarkItemPayload[];
  softSkills?: SoftSkillItemPayload[];
}

export interface SaveAccumulativeMarksPayload {
  sessionYear: string;
  className: string;
  students: StudentAccumulativeEntry[];
}

export async function saveAccumulativeMarksAction(payload: SaveAccumulativeMarksPayload) {
  try {
    const { sessionYear, className, students } = payload;

    if (!sessionYear || !className || !students || students.length === 0) {
      return { success: false, error: "Missing required session, class, or student entries." };
    }

    await prisma.$transaction(async (tx) => {
      for (const entry of students) {
        if (!entry.srNumber) continue;

        // 1. Fetch student to verify existence
        const student = await tx.student.findUnique({
          where: { srNumber: entry.srNumber },
          include: { parents: true },
        });

        if (!student) continue;

        // 2. Update Student demographics & physical metrics
        let medicalNotes = student.medicalConditions || "";
        if (entry.height || entry.weight) {
          const hwTag = `[Physique: Ht ${entry.height || "-"} cm, Wt ${entry.weight || "-"} kg]`;
          if (medicalNotes.includes("[Physique:")) {
            medicalNotes = medicalNotes.replace(/\[Physique:[^\]]+\]/, hwTag);
          } else {
            medicalNotes = medicalNotes ? `${medicalNotes} ${hwTag}` : hwTag;
          }
        }

        await tx.student.update({
          where: { srNumber: entry.srNumber },
          data: {
            bloodGroup: entry.bloodGroup !== undefined ? entry.bloodGroup || null : student.bloodGroup,
            distanceFromSchool:
              entry.distanceFromSchool !== undefined && entry.distanceFromSchool !== null
                ? entry.distanceFromSchool
                : student.distanceFromSchool,
            medicalConditions: medicalNotes || null,
          },
        });

        // 3. Update or Upsert Father & Mother qualifications in Parent records
        if (entry.fatherQualification !== undefined) {
          const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
          if (father) {
            await tx.parent.update({
              where: { id: father.id },
              data: { educationQualification: entry.fatherQualification || null },
            });
          } else if (entry.fatherQualification) {
            await tx.parent.create({
              data: {
                studentSrNumber: entry.srNumber,
                relationType: "Father",
                firstName: "Father",
                lastName: "",
                educationQualification: entry.fatherQualification,
              },
            });
          }
        }

        if (entry.motherQualification !== undefined) {
          const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
          if (mother) {
            await tx.parent.update({
              where: { id: mother.id },
              data: { educationQualification: entry.motherQualification || null },
            });
          } else if (entry.motherQualification) {
            await tx.parent.create({
              data: {
                studentSrNumber: entry.srNumber,
                relationType: "Mother",
                firstName: "Mother",
                lastName: "",
                educationQualification: entry.motherQualification,
              },
            });
          }
        }

        // 4. Find or create AcademicSession for this student, class and sessionYear
        let academicSession = await tx.academicSession.findFirst({
          where: {
            studentSrNumber: entry.srNumber,
            sessionYear: sessionYear,
            className: className,
          },
        });

        if (!academicSession) {
          academicSession = await tx.academicSession.create({
            data: {
              studentSrNumber: entry.srNumber,
              sessionYear: sessionYear,
              className: className,
              rollNumber: entry.rollNumber || null,
              totalMeetingsPresent: entry.attendancePresent !== undefined ? entry.attendancePresent : null,
              totalMeetings: entry.attendanceTotal !== undefined ? entry.attendanceTotal : null,
              annualAttendance: entry.attendancePresent !== undefined ? entry.attendancePresent : null,
              annualTotalDays: entry.attendanceTotal !== undefined ? entry.attendanceTotal : null,
              resultStatus: entry.resultStatus || null,
            },
          });
        } else {
          academicSession = await tx.academicSession.update({
            where: { id: academicSession.id },
            data: {
              rollNumber: entry.rollNumber !== undefined ? entry.rollNumber : academicSession.rollNumber,
              totalMeetingsPresent:
                entry.attendancePresent !== undefined ? entry.attendancePresent : academicSession.totalMeetingsPresent,
              totalMeetings:
                entry.attendanceTotal !== undefined ? entry.attendanceTotal : academicSession.totalMeetings,
              annualAttendance:
                entry.attendancePresent !== undefined ? entry.attendancePresent : academicSession.annualAttendance,
              annualTotalDays:
                entry.attendanceTotal !== undefined ? entry.attendanceTotal : academicSession.annualTotalDays,
              resultStatus: entry.resultStatus !== undefined ? entry.resultStatus : academicSession.resultStatus,
            },
          });
        }

        const sessionId = academicSession.id;

        // 5. Upsert Marks with exact Max Marks & Grades
        if (entry.marks && entry.marks.length > 0) {
          for (const m of entry.marks) {
            if (!m.subjectName || !m.examType) continue;

            const existingMark = await tx.mark.findFirst({
              where: {
                academicSessionId: sessionId,
                subjectName: m.subjectName,
                examType: m.examType,
              },
            });

            if (existingMark) {
              await tx.mark.update({
                where: { id: existingMark.id },
                data: {
                  oralMarksObtained: m.oralMarksObtained !== undefined ? m.oralMarksObtained : existingMark.oralMarksObtained,
                  oralMaxMarks: m.oralMaxMarks !== undefined ? m.oralMaxMarks : existingMark.oralMaxMarks,
                  writtenMarksObtained: m.writtenMarksObtained !== undefined ? m.writtenMarksObtained : existingMark.writtenMarksObtained,
                  writtenMaxMarks: m.writtenMaxMarks !== undefined ? m.writtenMaxMarks : existingMark.writtenMaxMarks,
                  totalMarksObtained: m.totalMarksObtained !== undefined ? m.totalMarksObtained : existingMark.totalMarksObtained,
                  totalMaxMarks: m.totalMaxMarks !== undefined ? m.totalMaxMarks : existingMark.totalMaxMarks,
                  grade: m.grade !== undefined ? m.grade : existingMark.grade,
                },
              });
            } else {
              await tx.mark.create({
                data: {
                  academicSessionId: sessionId,
                  subjectName: m.subjectName,
                  examType: m.examType,
                  oralMarksObtained: m.oralMarksObtained ?? null,
                  oralMaxMarks: m.oralMaxMarks ?? null,
                  writtenMarksObtained: m.writtenMarksObtained ?? null,
                  writtenMaxMarks: m.writtenMaxMarks ?? null,
                  totalMarksObtained: m.totalMarksObtained ?? null,
                  totalMaxMarks: m.totalMaxMarks ?? null,
                  grade: m.grade ?? null,
                },
              });
            }
          }
        }

        // 6. Upsert SoftSkills (Co-scholastic, Art/Craft, P.T., etc.)
        if (entry.softSkills && entry.softSkills.length > 0) {
          for (const s of entry.softSkills) {
            if (!s.skillName || !s.term) continue;

            const existingSkill = await tx.softSkill.findFirst({
              where: {
                academicSessionId: sessionId,
                skillName: s.skillName,
                term: s.term,
              },
            });

            if (existingSkill) {
              await tx.softSkill.update({
                where: { id: existingSkill.id },
                data: {
                  grade: s.grade,
                  remarks: s.remarks !== undefined ? s.remarks : existingSkill.remarks,
                },
              });
            } else {
              await tx.softSkill.create({
                data: {
                  academicSessionId: sessionId,
                  skillName: s.skillName,
                  term: s.term,
                  grade: s.grade,
                  remarks: s.remarks ?? null,
                },
              });
            }
          }
        }
      }
    });

    // Record audit event for marks submission so it appears in Director's Clearance & Activity Feed
    const firstStudent = students[0]?.srNumber;
    if (firstStudent) {
      await recordAuditLogAction({
        actionType: "MARKS_SUBMITTED",
        studentSrNumber: firstStudent,
        prefix: "MRK",
        details: {
          className,
          sessionYear,
          studentsUpdatedCount: students.length,
          submittedAt: new Date().toISOString(),
          status: "PENDING_DIRECTOR_REVIEW",
        },
      });
    }

    revalidatePath("/registers/data-entry");
    revalidatePath("/directory");
    revalidatePath("/director-dashboard");
    revalidatePath("/");

    // Revalidate individual student report card views
    students.forEach((entry) => {
      if (entry.srNumber) {
        const cleanSr = entry.srNumber.trim().toUpperCase();
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}`);
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/mid-levels`);
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/lower-primary`);
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/pre-primary`);
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/class-ix`);
        revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-card`);
      }
    });

    return {
      success: true,
      message: `Successfully saved marks and stats for ${students.length} student(s). Logged to Director's clearance queue.`,
      count: students.length,
    };
  } catch (error: unknown) {
    console.error("Failed to save accumulative marks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save accumulative marks register.",
    };
  }
}

/**
 * Direct In-Place Tweak & Edit action for Report Cards (Maker-Checker).
 * Saves modified marks and soft skills to SQLite, and logs a REPORT_CARD_MODIFIED
 * audit record awaiting Director executive approval.
 */
export interface SaveReportCardOverridePayload {
  srNumber: string;
  className: string;
  sessionYear: string;
  subjectMarks?: Record<
    string,
    {
      ut1?: number | string;
      ut1Max?: number | string;
      halfYearly?: number | string;
      halfYearlyMax?: number | string;
      ut2?: number | string;
      ut2Max?: number | string;
      annual?: number | string;
      annualMax?: number | string;
      grade?: string;
    }
  >;
  grades?: Record<string, { halfYearly?: string; annual?: string; term1?: string; term2?: string; term3?: string; term4?: string }>;
  attendanceHalfYearly?: string | null;
  attendanceAnnual?: string | null;
  rankInClass?: string | null;
  teacherRemark?: string | null;
  passedAndPromotedToClass?: string | null;
}

export async function saveReportCardOverrideAction(payload: SaveReportCardOverridePayload) {
  try {
    const {
      srNumber,
      className,
      sessionYear,
      subjectMarks,
      grades,
      attendanceHalfYearly,
      attendanceAnnual,
      rankInClass,
      teacherRemark,
      passedAndPromotedToClass,
    } = payload;

    if (!srNumber) {
      return { success: false, error: "Scholar Register Number is required." };
    }

    const cleanSr = srNumber.trim().toUpperCase();

    const student = await prisma.student.findUnique({
      where: { srNumber: cleanSr },
      include: { academicSessions: true },
    });

    if (!student) {
      return { success: false, error: `Student with S.R. Number "${cleanSr}" not found.` };
    }

    // Find or create session
    let session = await prisma.academicSession.findFirst({
      where: {
        studentSrNumber: cleanSr,
        sessionYear: sessionYear,
        className: className,
      },
    });

    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          studentSrNumber: cleanSr,
          sessionYear: sessionYear,
          className: className,
          resultStatus: passedAndPromotedToClass ? `Promoted to ${passedAndPromotedToClass}` : "Enrolled",
        },
      });
    } else {
      await prisma.academicSession.update({
        where: { id: session.id },
        data: {
          resultStatus: passedAndPromotedToClass ? `Promoted to ${passedAndPromotedToClass}` : session.resultStatus,
        },
      });
    }

    const sessionId = session.id;

    // Upsert Subject Marks
    if (subjectMarks) {
      for (const [subjectName, markRec] of Object.entries(subjectMarks)) {
        const examEntries = [
          { type: "Unit Test 1", val: markRec.ut1, max: markRec.ut1Max || 30 },
          { type: "Half Yearly", val: markRec.halfYearly, max: markRec.halfYearlyMax || 70 },
          { type: "Unit Test 2", val: markRec.ut2, max: markRec.ut2Max || 30 },
          { type: "Annual", val: markRec.annual, max: markRec.annualMax || 70 },
        ];

        for (const exam of examEntries) {
          if (exam.val === undefined || exam.val === "" || exam.val === null) continue;
          const numVal = typeof exam.val === "number" ? exam.val : parseFloat(String(exam.val));
          if (isNaN(numVal)) continue;

          const existingMark = await prisma.mark.findFirst({
            where: {
              academicSessionId: sessionId,
              subjectName: subjectName,
              examType: exam.type,
            },
          });

          if (existingMark) {
            await prisma.mark.update({
              where: { id: existingMark.id },
              data: {
                totalMarksObtained: numVal,
                totalMaxMarks: typeof exam.max === "number" ? exam.max : parseFloat(String(exam.max)) || 100,
                writtenMarksObtained: numVal,
                writtenMaxMarks: typeof exam.max === "number" ? exam.max : parseFloat(String(exam.max)) || 100,
                grade: markRec.grade || existingMark.grade,
              },
            });
          } else {
            await prisma.mark.create({
              data: {
                academicSessionId: sessionId,
                subjectName: subjectName,
                examType: exam.type,
                totalMarksObtained: numVal,
                totalMaxMarks: typeof exam.max === "number" ? exam.max : parseFloat(String(exam.max)) || 100,
                writtenMarksObtained: numVal,
                writtenMaxMarks: typeof exam.max === "number" ? exam.max : parseFloat(String(exam.max)) || 100,
                grade: markRec.grade || null,
              },
            });
          }
        }
      }
    }

    // Upsert Co-Scholastic & Soft Skills
    if (grades) {
      for (const [skillName, termGrades] of Object.entries(grades)) {
        const terms = [
          { term: "Half Yearly", grade: termGrades.halfYearly },
          { term: "Annual", grade: termGrades.annual },
          { term: "Term 1", grade: termGrades.term1 },
          { term: "Term 2", grade: termGrades.term2 },
          { term: "Term 3", grade: termGrades.term3 },
          { term: "Term 4", grade: termGrades.term4 },
        ];

        for (const t of terms) {
          if (!t.grade) continue;

          const existingSkill = await prisma.softSkill.findFirst({
            where: {
              academicSessionId: sessionId,
              skillName: skillName,
              term: t.term,
            },
          });

          if (existingSkill) {
            await prisma.softSkill.update({
              where: { id: existingSkill.id },
              data: { grade: t.grade },
            });
          } else {
            await prisma.softSkill.create({
              data: {
                academicSessionId: sessionId,
                skillName: skillName,
                term: t.term,
                grade: t.grade,
              },
            });
          }
        }
      }
    }

    // Record audit log for Report Card Modification
    await recordAuditLogAction({
      actionType: "REPORT_CARD_MODIFIED",
      studentSrNumber: cleanSr,
      prefix: "RC-MOD",
      details: {
        className,
        sessionYear,
        teacherRemark: teacherRemark || "Updated by faculty",
        rankInClass: rankInClass || "—",
        attendanceHalfYearly: attendanceHalfYearly || "—",
        attendanceAnnual: attendanceAnnual || "—",
        status: "PENDING_DIRECTOR_APPROVAL",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath(`/students/${encodeURIComponent(cleanSr)}`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/mid-levels`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/lower-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/pre-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/class-ix`);
    revalidatePath("/director-dashboard");
    revalidatePath("/registers/data-entry");

    return {
      success: true,
      message: `Report card changes for Scholar "${cleanSr}" have been saved to the database and queued for Director sign-off before official publication.`,
    };
  } catch (error: unknown) {
    console.error("Report card override error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save report card changes.",
    };
  }
}

/**
 * Enterprise Audit Logger for inline actions
 */
export async function logEditAction(
  studentSrNumber: string,
  actionType: string = "REPORT_CARD_INLINE_EDIT",
  details: Record<string, unknown> | string = {}
) {
  return await recordAuditLogAction({
    actionType: actionType as any,
    studentSrNumber: studentSrNumber.trim().toUpperCase(),
    prefix: "EDT",
    details,
  });
}

export interface UpdateStudentSubjectMarkPayload {
  studentSrNumber: string;
  subjectId: string; // Subject Name (e.g., "Mathematics", "Science")
  examType: string;  // e.g. "Unit Test 1", "Half Yearly", "Unit Test 2", "Annual"
  marksObtained?: number | string | null;
  maxMarks?: number | string | null;
  academicSessionId?: string;
  className?: string;
  sessionYear?: string;
}

/**
 * Atomic Server Action for inline score editing & real-time onBlur auto-save.
 * Upserts the Mark record in SQLite and logs an audit trace.
 */
export async function updateStudentSubjectMark(payload: UpdateStudentSubjectMarkPayload) {
  try {
    const {
      studentSrNumber,
      subjectId,
      examType,
      marksObtained,
      maxMarks,
      academicSessionId,
      className,
      sessionYear,
    } = payload;

    if (!studentSrNumber || !subjectId || !examType) {
      return { success: false, error: "Student S.R. Number, Subject ID, and Exam Type are required." };
    }

    const cleanSr = studentSrNumber.trim().toUpperCase();
    const cleanSubject = subjectId.trim();

    // Standardize Exam Type
    let normalizedExam = examType.trim();
    const examUpper = normalizedExam.toUpperCase();
    if (examUpper.includes("UT1") || examUpper.includes("TEST 1") || examUpper.includes("ASSESSMENT 1") || examUpper.includes("TERM 1")) {
      normalizedExam = "Unit Test 1";
    } else if (examUpper.includes("HALF") || examUpper.includes("HY") || examUpper.includes("MID")) {
      normalizedExam = "Half Yearly";
    } else if (examUpper.includes("UT2") || examUpper.includes("TEST 2") || examUpper.includes("ASSESSMENT 2") || examUpper.includes("TERM 3")) {
      normalizedExam = "Unit Test 2";
    } else if (examUpper.includes("ANNUAL") || examUpper.includes("FINAL") || examUpper.includes("YEARLY") || examUpper.includes("TERM 4")) {
      normalizedExam = "Annual";
    }

    // Parse numeric mark & max mark
    let numScore: number | null = null;
    if (marksObtained !== undefined && marksObtained !== null && marksObtained !== "") {
      const parsed = typeof marksObtained === "number" ? marksObtained : parseFloat(String(marksObtained).trim());
      if (!isNaN(parsed)) {
        numScore = parsed;
      }
    }

    let numMax: number = 100;
    if (maxMarks !== undefined && maxMarks !== null && maxMarks !== "") {
      const parsedMax = typeof maxMarks === "number" ? maxMarks : parseFloat(String(maxMarks).trim());
      if (!isNaN(parsedMax) && parsedMax > 0) {
        numMax = parsedMax;
      }
    } else {
      // Sensible standard defaults based on exam type
      if (normalizedExam === "Unit Test 1" || normalizedExam === "Unit Test 2") numMax = 30;
      else if (normalizedExam === "Half Yearly" || normalizedExam === "Annual") numMax = 70;
    }

    // Calculate Grade if score is present
    let grade: string | null = null;
    if (numScore !== null) {
      const pct = (numScore / numMax) * 100;
      if (pct >= 91) grade = "A1";
      else if (pct >= 81) grade = "A2";
      else if (pct >= 71) grade = "B1";
      else if (pct >= 61) grade = "B2";
      else if (pct >= 51) grade = "C1";
      else if (pct >= 41) grade = "C2";
      else if (pct >= 33) grade = "D";
      else if (pct >= 21) grade = "E1";
      else grade = "E2";
    }

    // Find student
    const student = await prisma.student.findUnique({
      where: { srNumber: cleanSr },
      include: {
        academicSessions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return { success: false, error: `Student with S.R. No "${cleanSr}" not found.` };
    }

    // Resolve or create academic session
    let targetSession = academicSessionId
      ? student.academicSessions.find((s) => s.id === academicSessionId)
      : student.academicSessions[0];

    if (!targetSession) {
      targetSession = await prisma.academicSession.create({
        data: {
          studentSrNumber: cleanSr,
          sessionYear: sessionYear || "2026-2027",
          className: className || "CLASS V",
        },
      });
    }

    const sessionId = targetSession.id;

    // Upsert mark record
    const existingMark = await prisma.mark.findFirst({
      where: {
        academicSessionId: sessionId,
        subjectName: cleanSubject,
        examType: normalizedExam,
      },
    });

    let savedMark;
    if (existingMark) {
      savedMark = await prisma.mark.update({
        where: { id: existingMark.id },
        data: {
          totalMarksObtained: numScore,
          writtenMarksObtained: numScore,
          totalMaxMarks: numMax,
          writtenMaxMarks: numMax,
          grade: grade ?? existingMark.grade,
        },
      });
    } else {
      savedMark = await prisma.mark.create({
        data: {
          academicSessionId: sessionId,
          subjectName: cleanSubject,
          examType: normalizedExam,
          totalMarksObtained: numScore,
          writtenMarksObtained: numScore,
          totalMaxMarks: numMax,
          writtenMaxMarks: numMax,
          grade: grade,
        },
      });
    }

    // Fire audit logging
    await logEditAction(cleanSr, "REPORT_CARD_INLINE_EDIT", {
      subjectId: cleanSubject,
      examType: normalizedExam,
      newScore: numScore,
      maxMarks: numMax,
      grade,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Revalidate paths for instant client and report card sync
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/mid-levels`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/lower-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/pre-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/class-ix`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-card`);
    revalidatePath("/registers/data-entry");
    revalidatePath("/directory");

    return {
      success: true,
      data: {
        id: savedMark.id,
        subjectName: savedMark.subjectName,
        examType: savedMark.examType,
        totalMarksObtained: savedMark.totalMarksObtained,
        totalMaxMarks: savedMark.totalMaxMarks,
        grade: savedMark.grade,
      },
    };
  } catch (error: unknown) {
    console.error("Failed to update student mark inline:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update mark.",
    };
  }
}

export interface UpdateSoftSkillPayload {
  studentSrNumber: string;
  skillName: string; // Project subject name, co-scholastic skill, or personality trait
  term: string;      // "Half Yearly", "Annual", "Term 1", etc.
  grade: string;     // "A+", "A", "Always", "Most of the time", etc.
  academicSessionId?: string;
  className?: string;
  sessionYear?: string;
  remarks?: string;
}

/**
 * Server Action for inline editing & real-time auto-saving of Project Grades & Co-Scholastic skills.
 */
export async function updateStudentSoftSkillMark(payload: UpdateSoftSkillPayload) {
  try {
    const {
      studentSrNumber,
      skillName,
      term,
      grade,
      academicSessionId,
      className,
      sessionYear,
      remarks,
    } = payload;

    if (!studentSrNumber || !skillName || !term) {
      return { success: false, error: "Student S.R. Number, Skill/Project Name, and Term are required." };
    }

    const cleanSr = studentSrNumber.trim().toUpperCase();
    const cleanSkill = skillName.trim();
    const cleanTerm = term.trim();
    const cleanGrade = (grade || "").trim() || "A+";

    const student = await prisma.student.findUnique({
      where: { srNumber: cleanSr },
      include: {
        academicSessions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return { success: false, error: `Student with S.R. No "${cleanSr}" not found.` };
    }

    let targetSession = academicSessionId
      ? student.academicSessions.find((s) => s.id === academicSessionId)
      : student.academicSessions[0];

    if (!targetSession) {
      targetSession = await prisma.academicSession.create({
        data: {
          studentSrNumber: cleanSr,
          sessionYear: sessionYear || "2026-2027",
          className: className || "CLASS IX",
        },
      });
    }

    const sessionId = targetSession.id;

    // Upsert SoftSkill record
    const existingSkill = await prisma.softSkill.findFirst({
      where: {
        academicSessionId: sessionId,
        skillName: cleanSkill,
        term: cleanTerm,
      },
    });

    let savedSkill;
    if (existingSkill) {
      savedSkill = await prisma.softSkill.update({
        where: { id: existingSkill.id },
        data: {
          grade: cleanGrade,
          remarks: remarks !== undefined ? remarks : existingSkill.remarks,
        },
      });
    } else {
      savedSkill = await prisma.softSkill.create({
        data: {
          academicSessionId: sessionId,
          skillName: cleanSkill,
          term: cleanTerm,
          grade: cleanGrade,
          remarks: remarks ?? null,
        },
      });
    }

    // Fire audit logging
    await logEditAction(cleanSr, "REPORT_CARD_INLINE_EDIT", {
      skillName: cleanSkill,
      term: cleanTerm,
      grade: cleanGrade,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // Revalidate paths
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/class-ix`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/mid-levels`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/lower-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-cards/pre-primary`);
    revalidatePath(`/students/${encodeURIComponent(cleanSr)}/report-card`);

    return {
      success: true,
      data: savedSkill,
    };
  } catch (error: unknown) {
    console.error("Failed to update student soft skill / project grade:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update project grade.",
    };
  }
}


