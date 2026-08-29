import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { TransferCertificateClient } from "@/components/documents/TransferCertificateClient";
import {
  type TransferCertificateData,
  type TCAcademicRow,
  TC_CLASSES,
} from "@/components/documents/TransferCertificate";
import { decryptData } from "@/lib/encryption";
import {
  generateDeterministicTraceCode,
  generateVerificationQRDataUrl,
} from "@/lib/document-security";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
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

// Maps arbitrary database className strings to the 13 official TC class keys
function mapClassNameToTCKey(rawClassName: string): string | null {
  if (!rawClassName) return null;
  const clean = rawClassName.trim().toUpperCase();

  if (clean.includes("NUR") || clean.includes("PRE-PRIMARY") || clean.includes("PLAY")) {
    return "Nur-";
  }
  if (clean.includes("L.K.G") || clean.includes("LKG") || clean.includes("LOWER")) {
    return "LKG";
  }
  if (clean.includes("U.K.G") || clean.includes("UKG") || clean.includes("UPPER")) {
    return "UKG";
  }
  if (clean === "CLASS I" || clean === "CLASS 1" || clean === "I" || clean === "1" || clean === "1ST") {
    return "I";
  }
  if (clean === "CLASS II" || clean === "CLASS 2" || clean === "II" || clean === "2" || clean === "2ND") {
    return "II";
  }
  if (clean === "CLASS III" || clean === "CLASS 3" || clean === "III" || clean === "3" || clean === "3RD") {
    return "III";
  }
  if (clean === "CLASS IV" || clean === "CLASS 4" || clean === "IV" || clean === "4" || clean === "4TH") {
    return "IV";
  }
  if (clean === "CLASS V" || clean === "CLASS 5" || clean === "V" || clean === "5" || clean === "5TH") {
    return "V";
  }
  if (clean === "CLASS VI" || clean === "CLASS 6" || clean === "VI" || clean === "6" || clean === "6TH") {
    return "VI";
  }
  if (clean === "CLASS VII" || clean === "CLASS 7" || clean === "VII" || clean === "7" || clean === "7TH") {
    return "VII";
  }
  if (clean === "CLASS VIII" || clean === "CLASS 8" || clean === "VIII" || clean === "8" || clean === "8TH") {
    return "VIII";
  }
  if (clean === "CLASS IX" || clean === "CLASS 9" || clean === "IX" || clean === "9" || clean === "9TH") {
    return "IX";
  }
  if (clean === "CLASS X" || clean === "CLASS 10" || clean === "X" || clean === "10" || clean === "10TH") {
    return "X";
  }

  return null;
}

export default async function TransferCertificateServerPage({ params }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();

  // Fetch student along with parents, academic sessions, and audit logs
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
        orderBy: [{ sessionYear: "asc" }, { createdAt: "asc" }],
      },
      auditLogs: {
        where: { actionType: "PRINT_TC" },
        orderBy: { timestamp: "desc" },
        take: 1,
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
            No record exists for Scholar Register No.{" "}
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
              Directory
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
  const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
  const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
  const primaryParent = father || mother || student.parents[0];

  const fatherName = father
    ? `${father.firstName} ${father.lastName}`.trim()
    : primaryParent
    ? `${primaryParent.firstName} ${primaryParent.lastName}`.trim()
    : "—";
  const motherName = mother
    ? `${mother.firstName} ${mother.lastName}`.trim()
    : "—";

  // Academic sessions history
  const sessions = student.academicSessions;
  const initialSession = sessions[0];
  const latestSession = sessions[sessions.length - 1];

  const lastStudiedClass = latestSession?.className || "CLASS I";
  const sessionYear = latestSession?.sessionYear || "2026-2027";

  // Decrypt APAAR ID if stored encrypted
  const decryptedApaar = student.apaarId ? decryptData(student.apaarId) : "";

  // Build academic history table map for all 13 classes
  const academicHistory: Record<string, TCAcademicRow> = {};
  TC_CLASSES.forEach((cls) => {
    academicHistory[cls] = {
      className: cls,
      dateOfAdmission: "",
      result: "",
      workAndConduct: "",
    };
  });

  // Populate from DB sessions
  sessions.forEach((s) => {
    const tcKey = mapClassNameToTCKey(s.className);
    if (tcKey && academicHistory[tcKey]) {
      academicHistory[tcKey] = {
        className: tcKey,
        dateOfAdmission: formatDateFormatted(s.createdAt),
        result: s.resultStatus || "Passed & Promoted",
        workAndConduct: "Good",
      };
    }
  });

  // If first class has no specific admission date, use student creation date
  const firstSessionKey = initialSession ? mapClassNameToTCKey(initialSession.className) : null;
  if (firstSessionKey && academicHistory[firstSessionKey] && !academicHistory[firstSessionKey].dateOfAdmission) {
    academicHistory[firstSessionKey].dateOfAdmission = formatDateFormatted(student.createdAt);
  }

  // Deterministic Cryptographic Anti-Tamper Trace Code
  const traceCode = generateDeterministicTraceCode(
    {
      documentType: "TRANSFER_CERTIFICATE",
      srNumber: student.srNumber,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: student.dateOfBirth?.toISOString() || null,
      className: lastStudiedClass,
      sessionYear,
      resultStatus: latestSession?.resultStatus || "Passed & Promoted",
    },
    "TC"
  );

  // Generate high-resolution scannable QR Code data URL
  const qrCodeDataUrl = await generateVerificationQRDataUrl(traceCode);

  // Formatted sequential TC / Serial Number
  const cleanSrDigits = student.srNumber.replace(/[^0-9]/g, "") || "001";
  const serialNo = `THPHS/TC/${sessionYear}/${cleanSrDigits}`;

  const today = new Date();
  const issueDateFormatted = formatDateFormatted(today);

  // Ensure an immutable audit snapshot exists for immediate public verification
  await prisma.auditLog.upsert({
    where: { traceCode },
    update: {},
    create: {
      actionType: "PRINT_TC",
      studentSrNumber: student.srNumber,
      traceCode,
      details: JSON.stringify({
        serialNo,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        fatherName,
        motherName,
        dateOfBirth: formatDateFormatted(student.dateOfBirth),
        className: lastStudiedClass,
        sessionYear,
        resultStatus: latestSession?.resultStatus || "Passed & Promoted",
        issuedAt: today.toISOString(),
      }),
    },
  });

  const tcData: TransferCertificateData = {
    serialNo,
    admissionNo: student.srNumber,
    penNo: "", // Can be filled via live editor or DB
    apparId: decryptedApaar || "",
    traceCode,
    qrCodeDataUrl,

    studentName: `${student.firstName} ${student.lastName}`.trim(),
    dateOfBirthFormatted: formatDateFormatted(student.dateOfBirth),
    religion: student.religion || "HINDU",
    caste: student.category || "GENERAL",

    fatherName,
    motherName,

    lastInstitutionName: "TOWN HALL PUBLIC HIGH SCHOOL",
    tcSubmitted: "Submitt",
    sessionYear,

    academicHistory,

    dateOfRemoval: formatDateFormatted(today),
    issueDateFormatted,

    udiseCode: "09270916593",
    schoolName: "TOWN HALL PUBLIC HIGH SCHOOL",
    schoolAddressLine1: "Ramapuram , New Tilak Nagar Rakabganj",
    schoolAddressLine2: "Lucknow – 226004",
    schoolEmail: "thps1996@gmail.com",
    schoolMobile: "9235445596",
  };

  return <TransferCertificateClient student={tcData} />;
}
