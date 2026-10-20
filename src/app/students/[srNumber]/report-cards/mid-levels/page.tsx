import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { MidLevelsReportCardClient } from "@/components/documents/MidLevelsReportCardClient";
import {
  type MidLevelsReportCardData,
  type ReportCardLevel,
  UPPER_PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS,
  CO_SCHOLASTIC_ACTIVITIES,
} from "@/components/documents/MidLevelsReportCard";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import {
  generateDeterministicTraceCode,
  generateVerificationQRDataUrl,
} from "@/lib/document-security";
import { fetchLiveSubjectMarks, fetchLiveSoftSkills } from "@/lib/report-card-mapper";
import { decryptData } from "@/lib/encryption";
import { areSessionsEqual, parseSessionStartYear, resolveClassIndex, normalizeTermKey } from "@/lib/classHierarchy";

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

export default async function MidLevelsReportCardPage({ params, searchParams }: PageProps) {
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
  const className = selectedSession?.className || student.currentClass || latestSession?.className || student.admissionClass || "Class 6";
  const rawClass = className;
  const section = latestSession?.section ? ` - ${latestSession.section}` : "";
  const classAndSection = `${className}${section}`.trim();
  const sessionYear = latestSession?.sessionYear || student.admissionSession || "2026-2027";

  // Infer level (Upper Primary for Classes 3-5 vs Junior for Classes 6-8) based on master hierarchy
  const classIdx = resolveClassIndex(rawClass);
  const isJuniorClass = classIdx !== -1 ? classIdx >= 8 : /vi|vii|viii|6|7|8|junior/i.test(rawClass);
  const level: ReportCardLevel = isJuniorClass ? "junior" : "upper-primary";
  const activeSubjects = level === "junior" ? JUNIOR_SUBJECTS : UPPER_PRIMARY_SUBJECTS;

  // Fetch student's live records directly from the Mark table (Single Source of Truth)
  const subjectMarks = await fetchLiveSubjectMarks(decodedSrNumber, activeSubjects, latestSession?.id);

  // Co-Scholastic Grades
  const grades: Record<string, { halfYearly: string; annual: string }> = {};
  const defaultActivities = Array.isArray(CO_SCHOLASTIC_ACTIVITIES)
    ? [...CO_SCHOLASTIC_ACTIVITIES]
    : [
        'READING/RECITATION',
        'DICTATION/WRITING',
        'ART & CRAFT',
        'MORAL SCIENCE',
        'PHYSICAL EDUCATION',
        'ATTENDANCE',
      ];

  defaultActivities.forEach((act) => {
    grades[act] = {
      halfYearly: "",
      annual: "",
    };
  });

  const liveSoftSkills = await fetchLiveSoftSkills(decodedSrNumber);
  if (liveSoftSkills.length > 0) {
    liveSoftSkills.forEach((skill) => {
      const name = skill.skillName?.trim().toUpperCase();
      const matchingKey = defaultActivities.find(
        (a) => a === name || a.includes(name) || name.includes(a)
      );
      if (matchingKey) {
        const termNorm = skill.term?.trim().toUpperCase() || "";
        const termKey = normalizeTermKey(termNorm);
        if (termNorm.includes("HALF") || termKey === "term1" || termKey === "term2" || termNorm === "HY") {
          grades[matchingKey].halfYearly = skill.grade || "";
        } else {
          grades[matchingKey].annual = skill.grade || "";
        }
      }
    });
  }

  // Attendance formulation (truthful from database)
  const hyPresent = latestSession?.halfYearlyAttendance ?? null;
  const hyTotal = latestSession?.halfYearlyTotalDays ?? null;
  const annualPresent = latestSession?.annualAttendance ?? latestSession?.totalMeetingsPresent ?? null;
  const annualTotal = latestSession?.annualTotalDays ?? latestSession?.totalMeetings ?? null;
  const annualPercentage = (annualPresent !== null && annualTotal !== null && annualTotal > 0)
    ? Math.round((annualPresent / annualTotal) * 100)
    : null;

  const decryptedAadhaar = student.aadharNumber ? decryptData(student.aadharNumber) : null;

  // Deterministic Cryptographic Anti-Tamper Trace Code
  const traceCode = generateDeterministicTraceCode(
    {
      documentType: "REPORT_CARD_MID_LEVELS",
      srNumber: student.srNumber,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: student.dateOfBirth?.toISOString() || null,
      className: classAndSection,
      sessionYear,
      resultStatus: latestSession?.resultStatus || "—",
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
      actionType: "PRINT_REPORT_CARD_MID_LEVELS",
      studentSrNumber: student.srNumber,
      traceCode,
      details: JSON.stringify({
        documentTitle: level === "junior" ? "Junior Section Progress Report Card" : "Upper Primary Evaluation Progress Report",
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        fatherName,
        motherName,
        className: classAndSection,
        sessionYear,
        subjectMarks,
        grades,
        promotedToClass: latestSession?.resultStatus || "—",
        issuedAt: new Date().toISOString(),
      }),
    },
  });

  const reportCardData: MidLevelsReportCardData = {
    level,
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
    subjectMarks,
    grades,
    rankInClass: latestSession?.rank ? `${latestSession.rank}${latestSession.rank === 1 ? 'st' : latestSession.rank === 2 ? 'nd' : latestSession.rank === 3 ? 'rd' : 'th'} ( R )` : "",
    attendanceHalfYearly: (hyPresent !== null && hyTotal !== null) ? `${hyPresent} / ${hyTotal}` : "—",
    attendanceAnnual: (annualPresent !== null && annualTotal !== null) ? `${annualPresent} / ${annualTotal} (${annualPercentage}%)` : "—",
    teacherRemark: "",
    passedAndPromotedToClass: latestSession?.resultStatus || "",
    schoolReopenOn: "01.07.2026",
    traceCode,
    qrCodeDataUrl,
  };

  return <MidLevelsReportCardClient student={reportCardData} />;
}
