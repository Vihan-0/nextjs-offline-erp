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
  Layers,
  CreditCard,
  User,
  Share2,
  Check,
  Building2,
  Sparkles,
  Home,
} from "lucide-react";
import { StudentIDCard, type StudentIDCardData } from "./StudentIDCard";

interface StudentIDCardClientProps {
  student: StudentIDCardData;
}

export function StudentIDCardClient({ student }: StudentIDCardClientProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<"single" | "sheet">("single");
  const [copied, setCopied] = useState(false);

  const printSingleRef = useRef<HTMLDivElement>(null);
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Single card print trigger
  const handlePrintSingle = useReactToPrint({
    contentRef: printSingleRef,
    documentTitle: `ID_Card_${student.srNumber}_${student.fullName.replace(/\s+/g, "_")}`,
    pageStyle: `
      @page {
        size: 96mm 62mm;
        margin: 0mm;
      }
      @media print {
        html, body {
          width: 96mm !important;
          height: 62mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .student-id-card-root {
          box-shadow: none !important;
          margin: 0 !important;
          page-break-inside: avoid !important;
          border-width: 1.5px !important;
        }
      }
    `,
  });

  // A4 Sheet 8-Up batch print trigger
  const handlePrintSheet = useReactToPrint({
    contentRef: printSheetRef,
    documentTitle: `ID_Cards_A4_Sheet_${student.className}_${student.srNumber}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm 6mm;
      }
      @media print {
        html, body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-sheet-container {
          box-shadow: none !important;
          padding: 0 !important;
        }
        .student-id-card-root {
          box-shadow: none !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  });

  const triggerPrint = () => {
    if (viewMode === "single") {
      handlePrintSingle();
    } else {
      handlePrintSheet();
    }
  };

  const handleCopy = async () => {
    const text = `Student ID Card: ${student.fullName} (S.R. No: ${student.srNumber}, Class: ${student.className}, DoB: ${student.dateOfBirth}, Phone: ${student.mobile})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 pb-16 vector-grid-lines">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back & Title */}
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
                <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Student ID Card Generator</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-purple-950/60 text-purple-300 rounded-full border border-purple-800/60 font-mono">
                  {student.srNumber}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 truncate hidden md:block">
                {student.fullName} • Class: {student.className} • Active Session
              </p>
            </div>
          </div>

          {/* Right: Print Actions & Mode Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="hidden lg:flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode("single")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "single"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Single Badge
              </button>
              <button
                onClick={() => setViewMode("sheet")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "sheet"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                A4 Batch Sheet (8-Up)
              </button>
            </div>

            {/* Quick Copy Link/Info */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title="Copy student card summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Master Print Button */}
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-2 bg-[#12285a] hover:bg-[#1a387d] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md cursor-pointer border border-blue-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save ID Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left/Main Column: Card Canvas Previewer */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Viewport Control Bar */}
            <div className="flex items-center justify-between bg-zinc-900/90 px-4 py-2.5 rounded-xl border border-zinc-800 shadow-xs no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Live Preview
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <Sparkles className="w-3 h-3" />
                  300 DPI Print-Ready
                </span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <button
                  onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono font-semibold">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(1.8, +(s + 0.1).toFixed(2)))}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setScale(1.0)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ml-1 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-10 flex items-center justify-center min-h-[380px] overflow-auto shadow-inner">
              
              {viewMode === "single" ? (
                /* Single Card Preview */
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className="shrink-0"
                >
                  <StudentIDCard student={student} />
                </div>
              ) : (
                /* A4 Sheet 8-Up Batch Preview */
                <div
                  style={{
                    transform: `scale(${Math.min(scale * 0.7, 0.85)})`,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className="bg-white p-6 rounded-lg shadow-xl border border-stone-300 print-sheet-container"
                >
                  <div className="text-center text-[11px] font-black text-stone-500 mb-3 uppercase tracking-widest border-b pb-1">
                    A4 Sheet Layout (2 Columns × 4 Rows)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div key={idx} className="border border-dashed border-stone-300 p-1 rounded-xl">
                        <StudentIDCard student={student} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Printing Guideline Tip */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 flex items-start gap-3 no-print">
              <div className="p-1 bg-[#12285a] text-white rounded-md shrink-0 mt-0.5 border border-blue-700">
                <Printer className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-zinc-100">Printing Instructions for School Staff:</p>
                <p className="text-zinc-400 leading-relaxed">
                  In the print preview dialog, ensure <strong>Background Graphics</strong> is checked and <strong>Margins</strong> is set to <em>None / Default</em>. Cards are sized to standard landscape badge dimensions (96mm × 62mm) for PVC card printers or high-gloss sheet cutters.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Student Details Inspector & Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Student Metadata Card */}
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Student Record
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-950/60 text-emerald-300 rounded-full border border-emerald-800/60">
                  Active
                </span>
              </div>

              {/* Quick Info Grid */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Scholar No. (S.R.)</span>
                  <span className="font-bold text-zinc-100 font-mono">{student.srNumber}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Student Name</span>
                  <span className="font-bold text-zinc-100 uppercase">{student.fullName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Current Class</span>
                  <span className="font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                    {student.className}
                  </span>
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
                  <span className="font-semibold text-zinc-200">{student.dateOfBirth}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Primary Phone</span>
                  <span className="font-bold text-emerald-400 font-mono">{student.mobile}</span>
                </div>

                <div className="py-1">
                  <span className="text-zinc-400 block mb-1">Residential Address</span>
                  <p className="font-medium text-zinc-300 uppercase leading-relaxed bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px]">
                    {student.address}
                  </p>
                </div>
              </div>

              {/* Navigation and Quick Links */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
                <Link
                  href={`/students/${encodeURIComponent(student.srNumber)}`}
                  className="w-full text-center py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-semibold text-xs text-zinc-200 transition-colors"
                >
                  Return to Student Dossier
                </Link>
                <Link
                  href={`/directory`}
                  className="w-full text-center py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 font-semibold text-xs text-zinc-300 transition-colors"
                >
                  Browse Master Student Directory
                </Link>
              </div>
            </div>

            {/* School Profile Card */}
            <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-5 shadow-xs text-xs space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs pb-2 border-b border-zinc-800">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Issuing Authority</span>
              </div>
              <div className="space-y-1 text-zinc-400">
                <p className="font-bold text-[#991b1b]">TOWN HALL PUBLIC HIGH SCHOOL</p>
                <p className="italic text-zinc-300 font-medium">(A Tradition in Quality Education)</p>
                <p className="text-zinc-500">Kundari Rakabganj, Ramapuram, Lucknow.</p>
                <p className="font-semibold text-zinc-300 font-mono">Helpline: 9235445596</p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Hidden Isolated Elements for High-Resolution Direct Printing */}
      <div className="hidden">
        {/* Single Badge Print Target */}
        <div ref={printSingleRef} className="bg-white p-0 m-0">
          <StudentIDCard student={student} />
        </div>

        {/* A4 Batch 8-Up Print Target */}
        <div ref={printSheetRef} className="bg-white p-0 m-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 justify-items-center">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="page-break-inside-avoid">
                <StudentIDCard student={student} />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
