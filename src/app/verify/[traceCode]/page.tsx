import React from "react";
import Link from "next/link";
import { getAuditLogByTraceCode } from "@/actions/audit";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  BookOpen,
  Award,
  ArrowLeft,
  Home,
  CheckCircle2,
  Lock,
  Clock,
  Printer,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    traceCode: string;
  }>;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function DocumentVerificationPage({ params }: PageProps) {
  const { traceCode } = await params;
  const decodedTraceCode = decodeURIComponent(traceCode).trim().toUpperCase();

  const auditLog = await getAuditLogByTraceCode(decodedTraceCode);

  if (!auditLog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans vector-grid-lines">
        <div className="bg-zinc-900 max-w-lg w-full rounded-3xl border border-red-900/60 p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-red-950/80 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-800">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 text-red-300 text-xs font-bold font-mono border border-red-800/60">
              UNVERIFIED / UNRECOGNIZED
            </div>
            <h1 className="text-2xl font-black text-zinc-100 font-serif">
              Document Verification Failed
            </h1>
            <p className="text-xs text-zinc-400">
              No matching record was found in the official institutional ledger for Security Trace Code:
            </p>
            <div className="font-mono font-bold text-red-300 text-sm bg-zinc-950 py-2.5 px-4 rounded-xl border border-red-900/60 tracking-wider">
              {decodedTraceCode}
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left text-xs space-y-2 text-zinc-400">
            <p className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              Security Advisory:
            </p>
            <p>
              If you are inspecting a physical report card or certificate bearing this code, it may be <strong>counterfeit, unauthorized, or tampered with</strong>.
            </p>
            <p>
              Please contact the Town Hall Public High School Examination Cell at <strong>9235445596</strong> for direct physical verification.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Try Another Code
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-colors"
            >
              <Home className="w-4 h-4" />
              School Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { student } = auditLog;
  let parsedDetails: Record<string, any> | null = null;
  try {
    if (auditLog.details) {
      parsedDetails = JSON.parse(auditLog.details);
    }
  } catch {
    parsedDetails = null;
  }

  const father = student?.parents.find((p) => p.relationType?.toLowerCase() === "father");
  const mother = student?.parents.find((p) => p.relationType?.toLowerCase() === "mother");
  const latestSession = student?.academicSessions[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 vector-grid-lines">
      {/* Sub Header */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Verify Other</span>
            </Link>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
              {auditLog.traceCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              OFFICIALLY AUTHENTICATED
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Verification Success Hero Banner */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
          <span className="absolute top-4 right-4 text-zinc-700 font-mono text-xs select-none">+</span>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 bg-emerald-950/60 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-800/60 shrink-0">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                    {auditLog.actionType}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    Cryptographically Validated
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 font-serif">
                  Town Hall Public High School Official Record
                </h1>
                <p className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Ledger Timestamp:</span>
                  <strong className="text-zinc-200 font-mono">{formatDate(auditLog.timestamp)}</strong>
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 shrink-0 space-y-1 text-center font-mono">
              <span className="text-[10px] text-zinc-500 block uppercase">Security Trace Code</span>
              <span className="text-sm font-bold text-zinc-100 tracking-wider block">
                {auditLog.traceCode}
              </span>
            </div>
          </div>
        </div>

        {/* Student Dossier Overview */}
        {student && (
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-md space-y-6">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="w-4 h-4 text-amber-400" />
              Verified Scholar Demographics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Scholar Name:</span>
                <span className="font-bold text-zinc-100 text-sm uppercase block">
                  {student.firstName} {student.lastName}
                </span>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Scholar Register No:</span>
                <span className="font-mono font-bold text-zinc-100 text-sm block">
                  {student.srNumber}
                </span>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Father's Name:</span>
                <span className="font-bold text-zinc-200 uppercase block">
                  {father ? `${father.firstName} ${father.lastName}`.trim() : "—"}
                </span>
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                <span className="text-zinc-500 block">Enrolled Class:</span>
                <span className="font-bold text-zinc-200 block">
                  {latestSession?.className || "—"} ({latestSession?.sessionYear || "—"})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Digital Twin Snapshot Details */}
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Original Immutable Snapshot Data
            </h2>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              Frozen State at Issuance
            </span>
          </div>

          {parsedDetails ? (
            <div className="space-y-4">
              {/* If Marks data exists */}
              {parsedDetails.subjectMarks && (
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-zinc-300">
                    Subject Marks Breakdown:
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-zinc-800 rounded-xl overflow-hidden">
                      <thead className="bg-zinc-950 text-zinc-400">
                        <tr>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold">Subject</th>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold text-center">UT-1 / Assmt-1</th>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold text-center">Half Yearly</th>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold text-center">UT-2 / Assmt-2</th>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold text-center">Annual</th>
                          <th className="py-2 px-3 border-b border-zinc-800 font-semibold text-center">Grand Total / Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                        {Object.entries(parsedDetails.subjectMarks).map(([subj, marks]: [string, any]) => (
                          <tr key={subj} className="hover:bg-zinc-800/40">
                            <td className="py-2 px-3 font-bold text-zinc-200">{subj}</td>
                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{marks?.assessment1 ?? marks?.ut1 ?? "—"}</td>
                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{marks?.halfYearly ?? "—"}</td>
                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{marks?.assessment2 ?? marks?.ut2 ?? "—"}</td>
                            <td className="py-2 px-3 text-center font-mono text-zinc-400">{marks?.annual ?? "—"}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-zinc-100">{marks?.grade || marks?.grandTotal || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* General Snapshot Payload JSON display */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <span className="font-mono text-[11px] text-zinc-500 uppercase block font-bold">
                  Complete Certified Payload:
                </span>
                <pre className="text-zinc-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(parsedDetails, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-400">
              {auditLog.details || "Document successfully generated and certified by Town Hall Public High School."}
            </div>
          )}
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Verify Another Document
          </Link>

          {student && (
            <Link
              href={`/students/${encodeURIComponent(student.srNumber)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-colors"
            >
              <User className="w-4 h-4" />
              View Student Profile
            </Link>
          )}
        </div>

      </main>
    </div>
  );
}
