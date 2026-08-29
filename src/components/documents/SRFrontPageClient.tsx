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
  User,
  Users,
  FileCheck2,
  CreditCard,
  Building2,
  Home,
} from "lucide-react";
import { SRFrontPage, type SRFrontPageData } from "./SRFrontPage";

interface SRFrontPageClientProps {
  student: SRFrontPageData;
}

export function SRFrontPageClient({ student }: SRFrontPageClientProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `SR_Front_Page_${student.srNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm;
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
        .sr-front-page-container {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: 100% !important;
          padding: 0 !important;
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                  S.R. Front Folio
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400">
                  {student.srNumber}
                </span>
              </div>
              <h1 className="text-sm font-black text-zinc-100 truncate">
                {student.studentName}
              </h1>
            </div>
          </div>

          {/* Center / Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Link to S.R. Back Page */}
            <Link
              href={`/students/${encodeURIComponent(student.srNumber)}/sr-back-page`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors"
              title="Open 10-Year Progression Folio (Back Page)"
            >
              <BookOpen className="w-4 h-4" />
              <span>S.R. Back Page</span>
            </Link>

            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-zinc-300 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors ml-1 border-l border-zinc-800 cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Primary Print Button */}
            <button
              type="button"
              onClick={() => handlePrint()}
              className="flex items-center gap-2 bg-[#0f2e60] hover:bg-[#1a3e7a] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-blue-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Front Folio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col items-center">
        
        {/* Document Banner Summary */}
        <div className="w-full max-w-[210mm] mb-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold border border-amber-800/60">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-zinc-100">Official Scholar Register Admission Folio</p>
              <p className="text-zinc-400 text-[11px]">
                Formatted for permanent binding into the school's Scholar Register Master Book.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/directory"
              className="text-zinc-300 hover:text-zinc-100 font-semibold px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Directory
            </Link>
            <Link
              href={`/students/${encodeURIComponent(student.srNumber)}/id-card`}
              className="text-zinc-300 hover:text-zinc-100 font-semibold px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              ID Badge
            </Link>
            <Link
              href={`/students/${encodeURIComponent(student.srNumber)}/sr-back-page`}
              className="text-emerald-300 hover:text-emerald-200 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 transition-colors"
            >
              Back Page →
            </Link>
          </div>
        </div>

        {/* Printable Document Preview Stage */}
        <div className="w-full flex justify-center overflow-auto py-2">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="shadow-2xl rounded-sm border border-stone-300 bg-white"
          >
            <div ref={printRef}>
              <SRFrontPage data={student} />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
