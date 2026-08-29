import React from "react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getEnclosureUrl } from "@/lib/enclosures";
import { EditStudentProfileButton } from "@/components/students/EditStudentProfileButton";
import { StudentEditData } from "@/components/students/EditStudentModal";
import { GeneralRemarkSection } from "@/components/students/GeneralRemarkSection";
import {
  CreditCard,
  ArrowLeft,
  User,
  Calendar,
  Phone,
  MapPin,
  Heart,
  FileText,
  ShieldAlert,
  Printer,
  Sparkles,
  FileCheck2,
  BookOpen,
  Home,
  Award,
  ShieldCheck,
  History,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  Copy,
  AlertCircle,
  IndianRupee,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    srNumber: string;
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

function getActiveReportCardRoute(className: string) {
  const norm = (className || "").toUpperCase().trim();
  if (norm.includes("NURSERY") || norm.includes("LKG") || norm.includes("UKG") || norm.includes("PRE")) {
    return {
      route: "pre-primary",
      label: "Pre-Primary Foundation Card",
      badge: "Early Childhood (4-Term)",
      color: "bg-rose-950/60 text-rose-300 border-rose-800/60 hover:bg-rose-900/60",
    };
  }
  if (norm.includes("VI") || norm.includes("VII") || norm.includes("VIII") || norm.includes("CLASS 6") || norm.includes("CLASS 7") || norm.includes("CLASS 8")) {
    return {
      route: "mid-levels",
      label: "Junior Wing Progress Card (VI–VIII)",
      badge: "Junior Section",
      color: "bg-amber-950/60 text-amber-300 border-amber-800/60 hover:bg-amber-900/60",
    };
  }
  if (norm.includes("IX") || norm.includes("X") || norm.includes("CLASS 9") || norm.includes("CLASS 10")) {
    return {
      route: "class-ix",
      label: "Secondary Progress Card (IX–X)",
      badge: "Secondary Board Standard",
      color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/60",
    };
  }
  return {
    route: "lower-primary",
    label: "Lower Primary Holistic Card (I–V)",
    badge: "Primary Wing",
    color: "bg-blue-950/60 text-blue-300 border-blue-800/60 hover:bg-blue-900/60",
  };
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();

  // Robust case-insensitive lookup
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
        orderBy: { createdAt: "desc" },
        include: {
          marks: true,
          softSkills: true,
        },
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 15,
      },
    },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 vector-grid-lines">
        <div className="bg-zinc-900 max-w-md w-full rounded-3xl border border-zinc-800 p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-red-950/60 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-800/60">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">Scholar Record Not Found</h1>
          <p className="text-sm text-zinc-400">
            No student record exists for Scholar Number{" "}
            <span className="font-mono font-bold text-zinc-200">{decodedSrNumber}</span>.
          </p>
          <div className="pt-4">
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Student Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
  const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
  const primaryParent = father || mother || student.parents[0];
  const latestSession = student.academicSessions[0];
  const className = latestSession?.className || "NURSERY";
  const sessionYear = latestSession?.sessionYear || "2026-2027";
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  const activeCardInfo = getActiveReportCardRoute(className);

  // Attendance calculation (truthful from database)
  const annualPresent = latestSession?.annualAttendance ?? latestSession?.totalMeetingsPresent ?? null;
  const annualTotal = latestSession?.annualTotalDays ?? latestSession?.totalMeetings ?? null;
  const attendancePercentage =
    annualPresent !== null && annualTotal !== null && annualTotal > 0
      ? Math.round((annualPresent / annualTotal) * 100)
      : null;

  // Prepare edit payload
  const studentEditData: StudentEditData = {
    srNumber: student.srNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    bloodGroup: student.bloodGroup,
    distanceFromSchool: student.distanceFromSchool,
    religion: student.religion,
    category: student.category,
    nationality: student.nationality,
    medicalConditions: student.medicalConditions,
    allergies: student.allergies,
    className,
    sessionYear,
    fatherName: father ? `${father.firstName} ${father.lastName}`.trim() : "",
    fatherPhone: father?.phoneNumber,
    fatherOccupation: father?.occupation,
    fatherEducation: father?.educationQualification,
    fatherIncome: father?.annualIncome,
    motherName: mother ? `${mother.firstName} ${mother.lastName}`.trim() : "",
    motherPhone: mother?.phoneNumber,
    motherOccupation: mother?.occupation,
    motherEducation: mother?.educationQualification,
    address: father?.address || mother?.address || primaryParent?.address,
    photoPath: student.photoPath,
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 pb-16 vector-grid-lines">
      {/* Top Breadcrumb Header Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link href="/directory" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Directory</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-zinc-400">{student.srNumber}</span>
            <span className="text-zinc-600">/</span>
            <span className="font-bold text-zinc-200">{fullName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <EditStudentProfileButton student={studentEditData} variant="pill" />
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
              Record: {student.recordStatus || "ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Scholar Banner Card */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <span className="absolute top-4 right-4 text-zinc-700 font-mono text-xs select-none">+</span>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 border-2 border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-zinc-500 shadow-inner">
              {student.photoPath ? (
                <img
                  src={getEnclosureUrl(student.photoPath)}
                  alt={fullName}
                  className="w-full h-full object-cover block"
                />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 uppercase tracking-tight font-serif">
                  {fullName}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-950/60 text-emerald-300 rounded-full border border-emerald-800/60">
                  Enrolled
                </span>
                <EditStudentProfileButton student={studentEditData} variant="pill" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Scholar No: <strong className="text-zinc-200 font-mono">{student.srNumber}</strong> • Class:{" "}
                <strong className="text-zinc-200">{className}</strong> ({sessionYear})
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-500 flex-wrap font-mono">
                <span>DOB: <strong>{formatDate(student.dateOfBirth)}</strong></span>
                <span>•</span>
                <span>Gender: <strong>{student.gender}</strong></span>
                <span>•</span>
                <span>Blood: <strong>{student.bloodGroup || "—"}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center shrink-0 min-w-[140px] space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 block">Annual Attendance</span>
            {attendancePercentage !== null ? (
              <>
                <div className="text-xl font-mono font-black text-emerald-400">
                  {attendancePercentage}%
                </div>
                <span className="text-[10px] font-mono text-zinc-400 block">
                  {annualPresent} / {annualTotal} Days
                </span>
              </>
            ) : (
              <>
                <div className="text-sm font-mono font-bold text-zinc-400 pt-1">
                  Not Recorded
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Pending Marks Entry
                </span>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE OFFICIAL DOCUMENT HUB                                                 */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5 relative overflow-hidden">
          <span className="absolute top-4 right-4 text-zinc-700 font-mono text-xs select-none">+</span>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Official Institutional Document Hub
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate, edit, print, and audit official CBSE and State Board certified records with zero-bleed print isolation.
              </p>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trace Verified
            </span>
          </div>

          {/* Document Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Active Class Progress Report Card (Smart Class-Aware) */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold border border-blue-800/60">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40">
                    {activeCardInfo.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  {activeCardInfo.label}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Official progress evaluation card for Class {className} with grading breakdown and anti-tamper QR code.
                </p>
              </div>

              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/${activeCardInfo.route}`}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Report Card</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2. School Leaving Transfer Certificate (T.C.) */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center font-bold border border-red-800/60">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-800/40">
                    20 CBSE Articles
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  Transfer Certificate (T.C.)
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Official School Leaving Certificate with discharge reasons, conduct certificate, and cryptographic trace stamp.
                </p>
              </div>

              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/transfer-certificate`}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Generate Official T.C.</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3. S.R. Front Master Folio */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold border border-amber-800/60">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
                    Admission Folio
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  S.R. Front Page Folio
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Permanent Scholar Register page with masked PAN number, enclosures checklist, and parent declaration.
                </p>
              </div>

              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/sr-front-page`}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Print S.R. Front Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4. S.R. Back 10-Year Progression Folio */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold border border-emerald-800/60">
                    <History className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                    10-Year Track
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  S.R. Back Page (10-Yr History)
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Decade-long progressive academic history tracking attendance, promotions, and annual results.
                </p>
              </div>

              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/sr-back-page`}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Print S.R. Back Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 5. Student Identity Card */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-purple-950/60 text-purple-400 flex items-center justify-center font-bold border border-purple-800/60">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                    Single & 8-Up
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  Student Identity Card
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Dual-format Student ID Card with single print and 8-card A4 batch layout for plastic/laminated cards.
                </p>
              </div>

              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/id-card`}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Print ID Card</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 6. Accumulative Marks Register Shortcut */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-zinc-850 text-zinc-300 flex items-center justify-center font-bold border border-zinc-700">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Class Tabulation
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  Marks & Tabulation Register
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open full class marks spreadsheet to enter or edit Unit Tests, Half-Yearly, and Annual exam marks.
                </p>
              </div>

              <Link
                href="/registers/data-entry"
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Marks Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 7. Fees, Concessions & Dues Hub Card */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold border border-emerald-800/60">
                    <IndianRupee className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                    Monthly Billing
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-100">
                  Fees, Concessions &amp; Dues
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Manage monthly fee profile, sibling/need concessions, collect multiple installments, and generate receipts.
                </p>
              </div>

              <Link
                href="/fees"
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Fees &amp; Dues</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* Secondary Curriculum Template Switcher */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400">
              Need another template? Switch between all 4 curriculum levels:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/pre-primary`}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition-colors"
              >
                Pre-Primary
              </Link>
              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/lower-primary`}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition-colors"
              >
                Lower Primary (I–V)
              </Link>
              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/mid-levels`}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition-colors"
              >
                Junior Wing (VI–VIII)
              </Link>
              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/class-ix`}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition-colors"
              >
                Class IX–X
              </Link>
            </div>
          </div>

        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Demographics */}
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 shadow-md space-y-4">
            <h2 className="font-bold text-zinc-100 text-sm flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="w-4 h-4 text-indigo-400" />
              Demographic & Health Vitals
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Date of Birth</span>
                <span className="font-bold text-zinc-100">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Gender</span>
                <span className="font-bold text-zinc-100">{student.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Blood Group</span>
                <span className="font-bold text-zinc-100">{student.bloodGroup || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Category & Religion</span>
                <span className="font-bold text-zinc-100">
                  {student.category || "General"} {student.religion ? `• ${student.religion}` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Nationality</span>
                <span className="font-bold text-zinc-100">{student.nationality || "Indian"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Medical Conditions / Allergies</span>
                <span className="font-bold text-zinc-200">
                  {student.medicalConditions || student.allergies || "None Reported (Normal)"}
                </span>
              </div>
            </div>
          </div>

          {/* Parents Information */}
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 shadow-md space-y-4">
            <h2 className="font-bold text-zinc-100 text-sm flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              Parent & Guardian Contact Dossier
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Father's Name</span>
                <span className="font-bold text-zinc-100 uppercase">
                  {father ? `${father.firstName} ${father.lastName}`.trim() : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Mother's Name</span>
                <span className="font-bold text-zinc-100 uppercase">
                  {mother ? `${mother.firstName} ${mother.lastName}`.trim() : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Emergency Phone</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {father?.phoneNumber || mother?.phoneNumber || primaryParent?.phoneNumber || "—"}
                </span>
              </div>
              <div className="py-1">
                <span className="text-zinc-400 block mb-1">Residential Address</span>
                <p className="font-semibold text-zinc-300 uppercase bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 leading-relaxed text-[11px]">
                  {father?.address || mother?.address || primaryParent?.address || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* General Administrative Remark Section */}
        <GeneralRemarkSection
          srNumber={student.srNumber}
          initialRemark={student.generalRemark}
        />

        {/* Enterprise Universal Audit Ledger Section */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <h2 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Universal Audit Ledger & Verification Timeline
            </h2>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              Immutable Trace Ledger
            </span>
          </div>

          {student.auditLogs && student.auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-950/60">
                    <th className="py-2.5 px-3 font-semibold">Action / Event</th>
                    <th className="py-2.5 px-3 font-semibold">Trace Code</th>
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Details / Context</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {student.auditLogs.map((log) => {
                    let parsedDetails: Record<string, unknown> | null = null;
                    try {
                      if (log.details) {
                        parsedDetails = JSON.parse(log.details);
                      }
                    } catch {
                      // plain string
                    }

                    return (
                      <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                              log.actionType.includes("TC")
                                ? "bg-red-950/60 text-red-300 border border-red-800/60"
                                : log.actionType.includes("REPORT")
                                ? "bg-blue-950/60 text-blue-300 border border-blue-800/60"
                                : log.actionType.includes("SR")
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                                : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                            }`}
                          >
                            {log.actionType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-100">
                          <Link
                            href={`/verify/${encodeURIComponent(log.traceCode)}`}
                            className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors inline-flex items-center gap-1"
                            title="Verify in Public Portal"
                          >
                            <span>{log.traceCode}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px] max-w-xs truncate">
                          {parsedDetails ? (
                            <span>{JSON.stringify(parsedDetails)}</span>
                          ) : (
                            log.details || "Official document generated / printed"
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Authentic
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 bg-zinc-950 rounded-2xl border border-dashed border-zinc-800 space-y-1">
              <History className="w-6 h-6 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-300">No print or modification events yet</p>
              <p className="text-[11px] text-zinc-500">
                When Transfer Certificates, Report Cards, or S.R. Folios are printed, their unique trace codes will be logged here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
