import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { TCRegisterClient } from "@/components/tc/TCRegisterClient";
import {
  ArrowLeft,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArchiveX,
} from "lucide-react";

export const metadata = {
  title: "TC Folder / Passed Students Register | School ERP",
  description: "Transfer Certificate Archive and Passed Students Record — issue TCs, track receiver details, and manage the passed students register.",
};

export default async function TCRegisterPage() {
  // Fetch all TC records with student data
  const tcRecords = await prisma.transferCertificateRecord.findMany({
    include: {
      student: {
        select: { srNumber: true, firstName: true, lastName: true, photoPath: true, generalRemark: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch students NOT YET in TC register (for "Issue New TC" dropdown)
  const studentsWithTC = new Set(tcRecords.map((r) => r.studentSrNumber));
  const allStudents = await prisma.student.findMany({
    select: {
      srNumber: true, firstName: true, lastName: true,
      academicSessions: { orderBy: { createdAt: "desc" }, take: 1 },
      parents: { where: { relationType: "Father" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Stats
  const totalIssued = tcRecords.length;
  const signed = tcRecords.filter((r) => r.receiptSignatureStatus === "SIGNED").length;
  const pending = tcRecords.filter((r) => r.receiptSignatureStatus === "PENDING_COLLECTION").length;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 pb-20">
      {/* Header bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-bold text-zinc-200">TC Folder / Passed Students</span>
          </div>
          <span className="text-zinc-500 font-mono hidden sm:block">
            Academic Records Vault
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 font-serif">TC Folder</h1>
                <p className="text-xs text-zinc-500">Passed Students Archive & Transfer Certificate Register</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total TCs Issued", value: totalIssued, icon: FileText, color: "text-red-400", bg: "bg-red-950/40 border-red-800/60" },
            { label: "Signed & Collected", value: signed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/60" },
            { label: "Pending Collection", value: pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/60" },
            { label: "Total Students", value: allStudents.length, icon: Users, color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800/60" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border ${stat.bg} p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg} border ${stat.bg.replace("40", "60")}`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main interactive client */}
        <TCRegisterClient
          tcRecords={tcRecords}
          allStudents={allStudents}
          studentsWithTC={Array.from(studentsWithTC)}
        />
      </main>
    </div>
  );
}
