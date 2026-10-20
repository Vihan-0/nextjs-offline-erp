import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { decryptData } from "@/lib/encryption";
import { areSessionsEqual, parseSessionStartYear, normalizeTermKey } from "@/lib/classHierarchy";
import { ClassIXReportCardClient } from "@/components/documents/ClassIXReportCardClient";
import {
  type ClassIXReportCardData,
  type TraitRating,
  CLASS_IX_SUBJECTS,
  CLASS_IX_PROJECT_SUBJECTS,
  CLASS_IX_PERSONALITY_TRAITS,
  getClassIXGrade,
} from "@/components/documents/ClassIXReportCard";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import {
  generateDeterministicTraceCode,
  generateVerificationQRDataUrl,
} from "@/lib/document-security";
import { fetchLiveSubjectMarks, fetchLiveSoftSkills } from "@/lib/report-card-mapper";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
  searchParams: Promise<{
    session?: string;
  }>;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export default async function ClassIXReportCardPage({ params, searchParams }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();
  const search = await searchParams;
  const sessionParam = search.session;

  // Eager load Student along with Parents and AcademicSession with Marks & SoftSkills
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { srNumber: decodedSrNumber },
        { srNumber: decodedSrNumber.toUpperCase() },
        { srNumber: decodedSrNumber.toLowerCase() },
      ],
    },
    include: {
      parents: true,
      academicSessions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          marks: true,
          softSkills: true,
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl border border-stone-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Student Not Found</h1>
          <p className="text-sm text-stone-500">
            No record found for Scholar No.{" "}
            <span className="font-mono font-bold text-stone-800">
              "{decodedSrNumber}"
            </span>
            .
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/directory"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Link>
            <Link
              href="/admission"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              New Admission
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract Parents
  const father = student.parents.find(
    (p) => p.relationType?.toLowerCase() === "father"
  );
  const mother = student.parents.find(
    (p) => p.relationType?.toLowerCase() === "mother"
  );
  const primaryParent = father || mother || student.parents[0];

  const fatherName = father
    ? `${father.firstName} ${father.lastName}`.trim()
    : "—";
  const motherName = mother
    ? `${mother.firstName} ${mother.lastName}`.trim()
    : "—";
  const contactNo =
    primaryParent?.phoneNumber ||
    father?.phoneNumber ||
    mother?.phoneNumber ||
    "—";
  const address =
    student.currentAddress ||
    primaryParent?.address ||
    father?.address ||
    mother?.address ||
    "—";

  // Academic Session Details
  const sortedSessions = [...student.academicSessions].sort((a, b) => {
    const yA = parseSessionStartYear(a.sessionYear) ?? 0;
    const yB = parseSessionStartYear(b.sessionYear) ?? 0;
    if (yA !== yB) return yB - yA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedSession = sessionParam 
    ? sortedSessions.find(s => areSessionsEqual(s.sessionYear, sessionParam))
    : sortedSessions[0];
    
  const latestSession = selectedSession || sortedSessions[0];
  const className = selectedSession?.className || student.currentClass || latestSession?.className || student.admissionClass || "Class 9";
  const section = latestSession?.section ? ` - ${latestSession.section}` : "";
  const classAndSection = `${className}${section}`.trim();
  const sessionYear = latestSession?.sessionYear || student.admissionSession || "2026-2027";

  // Fetch student's live records directly from the Mark table (Single Source of Truth)
  const rawSubjectMarks = await fetchLiveSubjectMarks(decodedSrNumber, CLASS_IX_SUBJECTS, latestSession?.id);

  const subjectMarks: Record<
    string,
    { assessment1?: number | string; halfYearly?: number | string; assessment2?: number | string; annual?: number | string; grandTotal?: number | string; grade?: string }
  > = {};

  CLASS_IX_SUBJECTS.forEach((subj) => {
    const raw = rawSubjectMarks[subj] || {};
    subjectMarks[subj] = {
      assessment1: raw.ut1 ?? "",
      halfYearly: raw.halfYearly ?? "",
      assessment2: raw.ut2 ?? "",
      annual: raw.annual ?? "",
      grandTotal: raw.grandTotal ?? "",
      grade: raw.grade ?? "",
    };
  });

  // Project Grades (do not auto-fill fake "A+"s when no records exist)
  const allProjectSubjects = [...CLASS_IX_PROJECT_SUBJECTS.left, ...CLASS_IX_PROJECT_SUBJECTS.right];
  const projectGrades: Record<string, { halfYearly: string; annual: string }> = {};
  allProjectSubjects.forEach((subj) => {
    projectGrades[subj] = {
      halfYearly: "",
      annual: "",
    };
  });

  // Personality Development Traits (do not auto-fill "Always" when unassessed)
  const personalityTraits: Record<string, { halfYearly?: TraitRating; annual?: TraitRating }> = {};
  CLASS_IX_PERSONALITY_TRAITS.forEach((trait) => {
    personalityTraits[trait] = {};
  });

  // Fetch Live SoftSkills / Project Grades / Traits from database
  const liveSoftSkills = await fetchLiveSoftSkills(decodedSrNumber);
  if (liveSoftSkills.length > 0) {
    liveSoftSkills.forEach((skill) => {
      const rawName = skill.skillName?.trim() || "";
      const cleanName = rawName.replace(/\s*\(Project\)/i, "").trim().toUpperCase();

      // Check if it's a Project Subject
      const matchedProject = allProjectSubjects.find(
        (p) => p.toUpperCase() === cleanName || cleanName.includes(p.toUpperCase()) || p.toUpperCase().includes(cleanName)
      );
      if (matchedProject) {
        const termNorm = skill.term?.trim().toUpperCase() || "";
        const termKey = normalizeTermKey(termNorm);
        if (termNorm.includes("HALF") || termKey === "term1" || termKey === "term2" || termNorm === "HY") {
          projectGrades[matchedProject].halfYearly = skill.grade || "";
        } else {
          projectGrades[matchedProject].annual = skill.grade || "";
        }
      }

      // Check if it's a Personality Trait
      const matchedTrait = CLASS_IX_PERSONALITY_TRAITS.find(
        (t) => t.toLowerCase() === rawName.toLowerCase() || t.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(t.toLowerCase())
      );
      if (matchedTrait) {
        const gradeVal = skill.grade?.trim();
        let rating: TraitRating | undefined = undefined;
        if (gradeVal?.toLowerCase().includes("most")) rating = "Most of the time";
        else if (gradeVal?.toLowerCase().includes("some")) rating = "Some-time";
        else if (gradeVal?.toLowerCase().includes("rare")) rating = "Rarely";
        else if (gradeVal?.toLowerCase().includes("never")) rating = "Never";
        else if (gradeVal === "A+" || gradeVal === "A" || gradeVal?.toLowerCase().includes("always")) rating = "Always";

        if (rating) {
          const termNorm = skill.term?.trim().toUpperCase() || "";
          if (termNorm.includes("HALF") || termNorm.includes("1") || termNorm.includes("I")) {
            personalityTraits[matchedTrait].halfYearly = rating;
          } else {
            personalityTraits[matchedTrait].annual = rating;
          }
        }
      }
    });
  }

  // Attendance (Do not show fake 94/96 or 192/198 when not entered)
  const hyPresent = latestSession?.halfYearlyAttendance ?? null;
  const hyTotal = latestSession?.halfYearlyTotalDays ?? null;
  const annualPresent = latestSession?.annualAttendance ?? latestSession?.totalMeetingsPresent ?? null;
  const annualTotal = latestSession?.annualTotalDays ?? latestSession?.totalMeetings ?? null;
  const attendanceHalfYearly = hyPresent !== null && hyTotal !== null ? `${hyPresent} / ${hyTotal}` : "—";
  const attendanceAnnual = annualPresent !== null && annualTotal !== null
    ? `${annualPresent} / ${annualTotal} (${Math.round((annualPresent / annualTotal) * 100)}%)`
    : "—";

  // Aadhaar decryption
  const rawAadhar = student.aadharNumber ? decryptData(student.aadharNumber) : null;
  const aadhaarNo = rawAadhar
    ? rawAadhar.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
    : "—";

  const rankInClass = latestSession?.rank
    ? `${latestSession.rank}${latestSession.rank === 1 ? 'st' : latestSession.rank === 2 ? 'nd' : latestSession.rank === 3 ? 'rd' : 'th'} ( R )`
    : "—";

  const promotedToClass = latestSession?.resultStatus || "—";
  const teacherRemark = "";

  // Deterministic Cryptographic Anti-Tamper Trace Code
  const traceCode = generateDeterministicTraceCode(
    {
      documentType: "REPORT_CARD_CLASS_IX",
      srNumber: student.srNumber,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: student.dateOfBirth?.toISOString() || null,
      className: classAndSection,
      sessionYear,
      resultStatus: promotedToClass,
      marksHash: JSON.stringify(subjectMarks),
    },
    "RC"
  );

  // Generate high-resolution scannable QR Code data URL
  const qrCodeDataUrl = await generateVerificationQRDataUrl(traceCode);

  // Ensure an immutable audit snapshot exists for immediate public verification
  await prisma.auditLog.upsert({
    where: { traceCode },
    update: {},
    create: {
      actionType: "PRINT_REPORT_CARD_CLASS_IX",
      studentSrNumber: student.srNumber,
      traceCode,
      details: JSON.stringify({
        documentTitle: "Class IX & X Annual Progress Report Card",
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        fatherName,
        motherName,
        className: classAndSection,
        sessionYear,
        subjectMarks,
        projectGrades,
        promotedToClass,
        issuedAt: new Date().toISOString(),
      }),
    },
  });

  const reportCardData: ClassIXReportCardData = {
    srNumber: student.srNumber,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    dateOfBirth: formatDate(student.dateOfBirth),
    fatherName,
    motherName,
    address,
    classAndSection,
    contactNo,
    branch: "MAIN BRANCH",
    aadhaarNo,
    sessionYear,
    subjectMarks,
    projectGrades,
    personalityTraits,
    rankInClass,
    attendanceHalfYearly,
    attendanceAnnual,
    promotedToClass,
    teacherRemark,
    traceCode,
    qrCodeDataUrl,
  };

  return <ClassIXReportCardClient student={reportCardData} />;
}
