import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { SRBackPageClient } from "@/components/documents/SRBackPageClient";
import { type SRBackPageData, type SRProgressionSession } from "@/components/documents/SRBackPage";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";
import {
  generateDeterministicTraceCode,
  generateVerificationQRDataUrl,
} from "@/lib/document-security";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
}

// Convert numbers 1-31 to ordinal words for day of month
const DAY_WORDS: Record<number, string> = {
  1: "First", 2: "Second", 3: "Third", 4: "Fourth", 5: "Fifth",
  6: "Sixth", 7: "Seventh", 8: "Eighth", 9: "Ninth", 10: "Tenth",
  11: "Eleventh", 12: "Twelfth", 13: "Thirteenth", 14: "Fourteenth", 15: "Fifteenth",
  16: "Sixteenth", 17: "Seventeenth", 18: "Eighteenth", 19: "Nineteenth", 20: "Twentieth",
  21: "Twenty-First", 22: "Twenty-Second", 23: "Twenty-Third", 24: "Twenty-Fourth", 25: "Twenty-Fifth",
  26: "Twenty-Sixth", 27: "Twenty-Seventh", 28: "Twenty-Eighth", 29: "Twenty-Ninth", 30: "Thirtieth",
  31: "Thirty-First"
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function numberToWords(num: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num >= 2000 && num < 2100) {
    const rem = num - 2000;
    if (rem === 0) return "Two Thousand";
    if (rem < 10) return `Two Thousand ${units[rem]}`;
    if (rem < 20) return `Two Thousand ${teens[rem - 10]}`;
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    return `Two Thousand ${tens[t]}${u ? ` ${units[u]}` : ""}`;
  }

  if (num >= 1900 && num < 2000) {
    const rem = num - 1900;
    if (rem === 0) return "Nineteen Hundred";
    if (rem < 10) return `Nineteen Hundred ${units[rem]}`;
    if (rem < 20) return `Nineteen ${teens[rem - 10]}`;
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    return `Nineteen ${tens[t]}${u ? ` ${units[u]}` : ""}`;
  }

  return String(num);
}

function formatDateInWords(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";

  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  const dayWord = DAY_WORDS[day] || String(day);
  const yearWord = numberToWords(year);

  return `${dayWord} ${month} ${yearWord}`;
}

function formatDateFormatted(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function SRBackPageServer({ params }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();

  // Fetch student along with all AcademicSession records in chronological order
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
        orderBy: [
          { sessionYear: "asc" },
          { createdAt: "asc" },
        ],
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
          <h1 className="text-xl font-bold text-stone-900">Student Record Not Found</h1>
          <p className="text-sm text-stone-500">
            No student found with Scholar Register Number{" "}
            <span className="font-semibold text-stone-800 font-mono">
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

  const fatherName = father
    ? `${father.firstName} ${father.lastName}`.trim()
    : "—";
  const motherName = mother
    ? `${mother.firstName} ${mother.lastName}`.trim()
    : "—";

  const primaryParent = father || mother || student.parents[0];
  const residentialAddress =
    primaryParent?.address ||
    father?.address ||
    mother?.address ||
    "—";

  // Map academic sessions into 10-year progression items
  const recordedSessions: SRProgressionSession[] = student.academicSessions.map(
    (session, index) => {
      // Annual attendance computation
      const annualAttendance = session.annualAttendance ?? session.totalMeetingsPresent ?? null;
      const annualTotalDays = session.annualTotalDays ?? session.totalMeetings ?? null;

      let attendancePercentage: string | null = null;
      if (annualAttendance !== null && annualTotalDays !== null && annualTotalDays > 0) {
        attendancePercentage = ((annualAttendance / annualTotalDays) * 100).toFixed(1) + "%";
      }

      return {
        yearNumber: index + 1,
        sessionYear: session.sessionYear || undefined,
        className: session.className || undefined,
        section: session.section || undefined,
        rollNumber: session.rollNumber || undefined,
        annualAttendance,
        annualTotalDays,
        attendancePercentage,
        resultStatus: session.resultStatus || "Promoted",
        rank: session.rank || null,
        remarks: null,
        isRecorded: true,
      };
    }
  );

  // Pad remaining up to 10 years if needed
  const totalSlots = Math.max(10, recordedSessions.length);
  const sessions: SRProgressionSession[] = Array.from({ length: totalSlots }).map((_, idx) => {
    const yearNumber = idx + 1;
    const existing = recordedSessions[idx];
    if (existing) return existing;
    return {
      yearNumber,
      isRecorded: false,
    };
  });

  const firstSession = student.academicSessions[0];
  const admissionClass = firstSession?.className || "NURSERY";

  // Deterministic Cryptographic Anti-Tamper Trace Code
  const traceCode = generateDeterministicTraceCode(
    {
      documentType: "SR_BACK_PAGE",
      srNumber: student.srNumber,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: student.dateOfBirth?.toISOString() || null,
      className: admissionClass,
      sessionYear: firstSession?.sessionYear || "2026-2027",
    },
    "SRB"
  );

  // Generate high-resolution scannable QR Code data URL
  const qrCodeDataUrl = await generateVerificationQRDataUrl(traceCode);

  // Ensure an immutable audit snapshot exists for immediate public verification
  await prisma.auditLog.upsert({
    where: { traceCode },
    update: {},
    create: {
      actionType: "PRINT_SR_BACK",
      studentSrNumber: student.srNumber,
      traceCode,
      details: JSON.stringify({
        documentTitle: "Scholar Register 10-Year Progression Folio",
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        fatherName,
        motherName,
        admissionClass,
        totalRecordedYears: recordedSessions.length,
        issuedAt: new Date().toISOString(),
      }),
    },
  });

  const srBackPageData: SRBackPageData = {
    srNumber: student.srNumber,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    fatherName,
    motherName,
    dateOfBirthFormatted: formatDateFormatted(student.dateOfBirth),
    dateOfBirthWords: formatDateInWords(student.dateOfBirth),
    admissionDateFormatted: formatDateFormatted(student.createdAt),
    admissionClass,
    category: student.category || "General",
    nationality: student.nationality || "Indian",
    residentialAddress,
    sessions,
    schoolName: "TOWN HALL PUBLIC HIGH SCHOOL",
    schoolTagline: "(A Tradition in Quality Education)",
    schoolAddress: "Kundari Rakabganj, Ramapuram, Lucknow - 226004",
    schoolPhone: "9235445596",
    traceCode,
    qrCodeDataUrl,
  };

  return <SRBackPageClient student={srBackPageData} />;
}
