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
  FileText,
  User,
  BookOpen,
} from "lucide-react";
import { BlankAdmissionForm, PrintableAdmissionFormData } from "./BlankAdmissionForm";

interface PrintableAdmissionFormClientProps {
  student: PrintableAdmissionFormData;
}

export function PrintableAdmissionFormClient({ student }: PrintableAdmissionFormClientProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Admission_Form_${(student.srNumber || "New").replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100 pb-16 vector-grid-lines">
      {/* Top Application Header Bar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Back Link & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {student.srNumber ? (
              <Link
                href={`/students/${encodeURIComponent(student.srNumber)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Student Profile</span>
              </Link>
            ) : (
              <Link
                href="/admission"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admission Desk</span>
              </Link>
            )}

            <div className="h-4 w-px bg-zinc-700 hidden sm:block" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-teal-950/60 text-teal-400 flex items-center justify-center font-bold border border-teal-800/60 shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <div className="truncate">
                <h1 className="text-sm font-bold text-zinc-100 truncate flex items-center gap-2 font-serif">
                  <span>Certified Admission Form</span>
                  {student.srNumber && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-teal-300 border border-zinc-700">
                      S.R. {student.srNumber}
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-zinc-400 truncate">
                  {student.studentName || "Blank Walk-In Registration"}
                  {student.admissionClass ? ` • Class: ${student.admissionClass}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Zoom & Print Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-zinc-800 rounded-xl border border-zinc-700 p-0.5">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 text-[11px] font-mono font-bold text-zinc-300 hover:text-zinc-100 transition-colors"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 150}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Form</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Print Viewport */}
      <main className="flex-1 flex justify-center py-8 px-4 overflow-x-auto">
        <div
          ref={printRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
          }}
        >
          <BlankAdmissionForm student={student} />
        </div>
      </main>
    </div>
  );
}
