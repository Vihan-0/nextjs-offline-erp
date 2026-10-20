import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { PrePrimaryReportCardClient } from "@/components/documents/PrePrimaryReportCardClient";
import {
  type PrePrimaryReportCardData,
  PRE_PRIMARY_CURRICULUM,
} from "@/components/documents/PrePrimaryReportCard";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import {
  generateDeterministicTraceCode,
  generateVerificationQRDataUrl,
} from "@/lib/document-security";
import { decryptData } from "@/lib/encryption";
import { areSessionsEqual, parseSessionStartYear, normalizeTermKey, convertScoreOrGradeToLetterGrade } from "@/lib/classHierarchy";

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

export default async function PrePrimaryReportCardPage({ params, searchParams }: PageProps) {
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
  const className = selectedSession?.className || student.currentClass || latestSession?.className || student.admissionClass || "Nursery - PP3";
  const section = latestSession?.section ? ` - ${latestSession.section}` : "";
  const classAndSection = `${className}${section}`.trim();
  const sessionYear = latestSession?.sessionYear || student.admissionSession || "2026-2027";

  // Build Assessment Map from Database Marks and SoftSkills
  const assessments: Record<
    string,
    { term1?: string; term2?: string; term3?: string; term4?: string }
  > = {};

  // 1. Initialize all curriculum keys as empty records
  PRE_PRIMARY_CURRICULUM.forEach((group) => {
    group.items.forEach((item) => {
      assessments[item] = {};
    });
  });

  // 2. Overlay actual SoftSkills if stored in DB
  if (latestSession?.softSkills) {
    latestSession.softSkills.forEach((skill) => {
      const name = skill.skillName;
      const targetKey = Object.keys(assessments).find(
        (k) => k.toLowerCase() === name?.toLowerCase() || k.toLowerCase().includes(name?.toLowerCase() || "") || (name && name.toLowerCase().includes(k.toLowerCase()))
      ) || name;
      if (!assessments[targetKey]) {
        assessments[targetKey] = {};
      }
      const termKey = normalizeTermKey(skill.term);
      if (termKey) {
        assessments[targetKey][termKey] = convertScoreOrGradeToLetterGrade(skill.grade);
      }
    });
  }

  // Helper to map register subject names to exact Pre-Primary template keys
  const resolvePrePrimarySubjectKey = (name: string): string => {
    const n = name.trim().toLowerCase();

    // English
    if (n.includes("english")) {
      if (n.includes("reading") || n.includes("recitation")) return "Reading / Recitation";
      if (n.includes("writing") || n.includes("dictation")) return "Writing / Dictation";
      if (n.includes("literature") || n.includes("language") || n.includes("activity") || n.includes("written")) {
        return "Written / Activity";
      }
    }

    // Hindi
    if (n.includes("hindi")) {
      if (n.includes("reading") || n.includes("recitation")) return "Reading / Recitation";
      if (n.includes("writing") || n.includes("dictation")) return "Writing / Dictation";
      if (n.includes("literature") || n.includes("language") || n.includes("activity") || n.includes("written")) {
        return "Written / Activity";
      }
    }

    // Maths
    if (n.includes("math")) {
      if (n.includes("logic") || n.includes("calc") || n.includes("numerical")) return "Numerical Concept";
      if (n.includes("oral") || n.includes("activity")) return "Activity";
      if (n.includes("written") || n.includes("mental")) return "Written";
    }

    // Environmental Learning / EVS
    if (n.includes("environmental") || n.includes("evs") || n.includes("environment")) {
      if (n.includes("oral") || n.includes("conversation")) return "Conversation Skill";
      if (n.includes("written") || n.includes("theme")) return "Theme Knowledge";
      if (n.includes("activity")) return "Activity";
    }

    // General Awareness
    if (n.includes("general") || n.includes("awareness") || n.includes("gk") || n.includes("g.k")) {
      return "General Awareness";
    }

    // Fallback: match by closest existing assessment key
    const match = Object.keys(assessments).find(
      (k) => k.toLowerCase() === n || k.toLowerCase().includes(n) || n.includes(k.toLowerCase())
    );
    return match || name;
  };

  // 3. Overlay live marks from database (Single Source of Truth, scoped to active session)
  const liveMarks = await prisma.mark.findMany({
    where: {
      academicSession: {
        studentSrNumber: decodedSrNumber.toUpperCase(),
        ...(latestSession?.id ? { id: latestSession.id } : {}),
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  liveMarks.forEach((mark) => {
    const targetKey = resolvePrePrimarySubjectKey(mark.subjectName);
    if (!assessments[targetKey]) {
      assessments[targetKey] = {};
    }
    const termKey = normalizeTermKey(mark.examType);
    const rawVal = mark.grade || (mark.totalMarksObtained !== null && mark.totalMarksObtained !== undefined ? mark.totalMarksObtained : mark.writtenMarksObtained);
    const grade = convertScoreOrGradeToLetterGrade(rawVal, mark.totalMaxMarks || mark.writtenMaxMarks || 100);

    if (termKey) {
      const validTerm = termKey as "term1" | "term2" | "term3" | "term4";
      if (!assessments[targetKey][validTerm]) {
        assessments[targetKey][validTerm] = grade;
      }
    }
  });

  // Attendance formulation (truthful from database)
  const annualPresent = latestSession?.annualAttendance ?? latestSession?.totalMeetingsPresent ?? null;
  const annualTotal = latestSession?.annualTotalDays ?? latestSession?.totalMeetings ?? null;
  const attendancePercentage = (annualPresent !== null && annualTotal !== null && annualTotal > 0)
    ? Math.round((annualPresent / annualTotal) * 100)
    : null;

  const decryptedAadhaar = student.aadharNumber ? decryptData(student.aadharNumber) : null;

  // Deterministic Cryptographic Anti-Tamper Trace Code
  const traceCode = generateDeterministicTraceCode(
    {
      documentType: "REPORT_CARD_PRE_PRIMARY",
      srNumber: student.srNumber,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: student.dateOfBirth?.toISOString() || null,
      className: classAndSection,
      sessionYear,
      resultStatus: latestSession?.resultStatus || "—",
      marksHash: JSON.stringify(assessments),
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
      actionType: "PRINT_REPORT_CARD_PRE_PRIMARY",
      studentSrNumber: student.srNumber,
      traceCode,
      details: JSON.stringify({
        documentTitle: "Pre-Primary Foundation Stage Evaluation Record",
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        fatherName,
        motherName,
        className: classAndSection,
        sessionYear,
        assessments,
        promotedToClass: latestSession?.resultStatus || "—",
        issuedAt: new Date().toISOString(),
      }),
    },
  });

  const reportCardData: PrePrimaryReportCardData = {
    srNumber: student.srNumber,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    dateOfBirth: formatDate(student.dateOfBirth),
    fatherName,
    motherName,
    address,
    classAndSection,
    contactNo,
    branch: "MAIN BRANCH",
    aadhaarNo: decryptedAadhaar ? decryptedAadhaar.replace(/(\d{4})(?=\d)/g, "$1 ") : "—",
    sessionYear,
    assessments,
    attendance: {
      term1: "",
      term2: "",
      term3: "",
      term4: "",
      total: (annualPresent !== null && annualTotal !== null)
        ? `${annualPresent} / ${annualTotal} Days (${attendancePercentage}%)`
        : "—",
    },
    teacherRemark: "",
    passedAndPromotedToClass: latestSession?.resultStatus || "",
    schoolReopenOn: "01.07.2027",
    traceCode,
    qrCodeDataUrl,
  };

  return <PrePrimaryReportCardClient student={reportCardData} />;
}
