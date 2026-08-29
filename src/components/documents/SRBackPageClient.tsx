"use client";

import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Share2,
  Check,
  Building2,
  Sparkles,
  Calendar,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Home,
} from "lucide-react";
import { SRBackPage, type SRBackPageData } from "./SRBackPage";

interface SRBackPageClientProps {
  student: SRBackPageData;
}

export function SRBackPageClient({ student }: SRBackPageClientProps) {
  const [scale, setScale] = useState<number>(0.92);
  const [copied, setCopied] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Print Handler via react-to-print for standard A4 Portrait
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `SR_Back_Page_${student.srNumber}_${student.studentName.replace(/\s+/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 6mm 4mm;
      }
      @media print {
        html, body {
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .sr-back-page-root {
          box-shadow: none !important;
          margin: 0 auto !important;
          page-break-inside: avoid !important;
          width: 100% !important;
          min-height: 100% !important;
        }
      }
    `,
  });

  const handleCopy = async () => {
    const text = `S.R. Back Page: ${student.studentName} (Scholar No: ${student.srNumber}, Recorded Sessions: ${student.sessions.filter(s => s.isRecorded).length}/10 Years)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const recordedCount = student.sessions.filter((s) => s.isRecorded).length;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 pb-16 vector-grid-lines">
      {/* Top Application Header Bar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back Link & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0 border border-zinc-700"
              title="Return to Home Dashboard"
            >
              <Home className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href={`/students/${encodeURIComponent(student.srNumber)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0 border border-zinc-700"
              title="Return to Student Profile"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="truncate">
              <h1 className="text-base font-bold text-zinc-100 truncate flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Scholar Register (S.R.) Back Page</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-950/60 text-emerald-300 rounded-full border border-emerald-800/60 font-mono">
                  {student.srNumber}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 truncate hidden md:block">
                {student.studentName} • 10-Year Progression Ledger • Official School Register
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Copy Link */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title="Copy student summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Master Print Button */}
            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 bg-[#0f2e60] hover:bg-[#1a3e7a] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all hover:shadow-md cursor-pointer border border-blue-800"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Print S.R. Folio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left/Main Column: Canvas Previewer */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between bg-zinc-900/90 px-4 py-2.5 rounded-xl border border-zinc-800 shadow-xs no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Live S.R. Folio Preview
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <Sparkles className="w-3 h-3" />
                  A4 Print-Ready (10-Year Track)
                </span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <button
                  onClick={() => setScale((s) => Math.max(0.5, +(s - 0.05).toFixed(2)))}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono font-semibold">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(1.4, +(s + 0.05).toFixed(2)))}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setScale(0.92)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ml-1 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-8 flex items-center justify-center min-h-[600px] overflow-auto shadow-inner">
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease-out",
                }}
                className="bg-white shadow-2xl rounded-xs border border-stone-300 shrink-0"
              >
                <SRBackPage data={student} />
              </div>
            </div>

            {/* Physical Register Book Instructions */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 flex items-start gap-3 no-print">
              <div className="p-1.5 bg-[#0f2e60] text-white rounded-md shrink-0 mt-0.5">
                <Printer className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-sm text-zinc-100">
                  Scholar Register (S.R.) Book Printing Instructions:
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  This document conforms with official physical Scholar Register folio standards for Indian schools. When printing directly into the physical <strong>Scholar Register Book</strong> or archiving as an A4 ledger sheet:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                  <li>Ensure <strong>Background Graphics</strong> is checked in the browser print dialog.</li>
                  <li>Set Margins to <strong>None / Minimum</strong> for 1:1 precision.</li>
                  <li>Blank ruled rows (up to Year 10) remain ready for annual manual endorsements or future digital re-prints.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Right Column: Student Summary & Session Progression Timeline */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Student Overview Card */}
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Scholar Folio Overview
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-950/60 text-emerald-300 rounded-full border border-emerald-800/60 font-mono">
                  {recordedCount} / 10 Years
                </span>
              </div>

              {/* Demographic Fields */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Scholar No. (S.R.)</span>
                  <span className="font-bold text-zinc-100 font-mono">{student.srNumber}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Student Name</span>
                  <span className="font-bold text-zinc-100 uppercase">{student.studentName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Father's Name</span>
                  <span className="font-semibold text-zinc-200 uppercase">{student.fatherName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Mother's Name</span>
                  <span className="font-semibold text-zinc-200 uppercase">{student.motherName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Date of Birth</span>
                  <span className="font-semibold text-zinc-200">{student.dateOfBirthFormatted}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Category / Social</span>
                  <span className="font-semibold text-zinc-200">{student.category || "General"}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Initial Admission Class</span>
                  <span className="font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                    {student.admissionClass || student.sessions[0]?.className || "NURSERY"}
                  </span>
                </div>
              </div>

              {/* Direct Links */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
                <Link
                  href={`/students/${encodeURIComponent(student.srNumber)}/sr-front-page`}
                  className="w-full text-center py-2 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 font-bold text-xs text-amber-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Open S.R. Front Page (Folio)
                </Link>
                <Link
                  href={`/students/${encodeURIComponent(student.srNumber)}`}
                  className="w-full text-center py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-semibold text-xs text-zinc-200 transition-colors"
                >
                  View Complete Student Profile
                </Link>
                <Link
                  href="/registers/data-entry"
                  className="w-full text-center py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 font-bold text-xs text-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Open Marks Register Data Entry
                </Link>
              </div>
            </div>

            {/* Academic Progression Timeline */}
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Progression Breakdown
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono font-medium">
                  {recordedCount} recorded sessions
                </span>
              </div>

              <div className="space-y-3">
                {student.sessions.filter(s => s.isRecorded).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2 text-center">
                    No academic sessions recorded yet.
                  </p>
                ) : (
                  student.sessions
                    .filter((s) => s.isRecorded)
                    .map((sess) => (
                      <div
                        key={sess.yearNumber}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-950 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 uppercase">
                            Year {sess.yearNumber}: {sess.className} {sess.section ? `(${sess.section})` : ""}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 font-medium">
                            {sess.sessionYear}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>
                            Attendance: <strong className="text-zinc-200">{sess.annualAttendance ?? "—"}</strong>
                            {sess.annualTotalDays ? ` / ${sess.annualTotalDays} days` : ""}
                          </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                              sess.resultStatus?.toLowerCase().includes("promoted") ||
                              sess.resultStatus?.toLowerCase().includes("pass")
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                                : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {sess.resultStatus || "Promoted"}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* School Profile Card */}
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-xs text-xs space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs pb-2 border-b border-zinc-800">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Issuing Authority</span>
              </div>
              <div className="space-y-1 text-zinc-400">
                <p className="font-bold text-[#991b1b]">TOWN HALL PUBLIC HIGH SCHOOL</p>
                <p className="italic text-zinc-300 font-medium">(A Tradition in Quality Education)</p>
                <p className="text-zinc-500">Kundari Rakabganj, Ramapuram, Lucknow.</p>
                <p className="font-semibold text-zinc-300 font-mono">Official Helpline: 9235445596</p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Hidden Isolated Print Target for High-Resolution Printing */}
      <div className="hidden">
        <div ref={printRef} className="bg-white p-0 m-0">
          <SRBackPage data={student} />
        </div>
      </div>

    </div>
  );
}
