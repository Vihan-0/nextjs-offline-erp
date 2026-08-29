import React from "react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getEnclosureUrl } from "@/lib/enclosures";
import {
  Users,
  UserPlus,
  FileCheck2,
  FileSpreadsheet,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Clock,
  Printer,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default async function Home() {
  // Fetch real-time statistics
  const [totalStudents, totalSessions, totalMarks, recentStudents, pendingApprovals] = await Promise.all([
    prisma.student.count().catch(() => 0),
    prisma.academicSession.count().catch(() => 0),
    prisma.mark.count().catch(() => 0),
    prisma.student
      .findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          academicSessions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          parents: true,
        },
      })
      .catch(() => []),
    prisma.student.count({ where: { recordStatus: "PENDING" } }).catch(() => 0),
  ]);

  return (
    <div
      className="min-h-screen font-sans text-slate-900 flex flex-col"
      style={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}
    >
      {/* Main Dashboard Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">

        {/* Hero Section Banner */}
        <section
          className="rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #0f2e60 0%, #153a77 50%, #1e3a8a 100%)",
            color: "#ffffff",
            borderColor: "#1e3a8a",
          }}
        >
          <div className="relative z-10 max-w-4xl space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "#e0f2fe",
                  borderColor: "rgba(255, 255, 255, 0.25)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#fcd34d" }} />
                Administrative Command Center
              </div>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#6ee7b7",
                  borderColor: "rgba(110, 231, 183, 0.35)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Offline Local System Active
              </span>

              <span
                className="text-xs font-serif italic hidden sm:inline-flex items-center"
                style={{ color: "#93c5fd" }}
              >
                “A Tradition in Quality Education” • Lucknow, U.P.
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight uppercase font-serif" style={{ color: "#ffffff" }}>
              Town Hall Public High School
            </h1>

            <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: "#e2e8f0" }}>
              Official school management portal for Student Admissions, Master Scholar Registers (S.R. Book Folios), Accumulative Marks Data Entry, Multi-Tier Report Cards, and PVC Identity Cards.
            </p>

            {/* Quick Metrics Badges */}
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className="rounded-2xl p-3.5 border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <span className="text-[11px] block font-semibold" style={{ color: "#bfdbfe" }}>Total Enrolled</span>
                <span className="text-xl sm:text-2xl font-black block" style={{ color: "#ffffff" }}>{totalStudents}</span>
                <span className="text-[10px] block font-bold" style={{ color: "#6ee7b7" }}>Active Scholars</span>
              </div>

              <div
                className="rounded-2xl p-3.5 border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <span className="text-[11px] block font-semibold" style={{ color: "#bfdbfe" }}>Academic Sessions</span>
                <span className="text-xl sm:text-2xl font-black block" style={{ color: "#ffffff" }}>{totalSessions}</span>
                <span className="text-[10px] block font-bold" style={{ color: "#7dd3fc" }}>Recorded Years</span>
              </div>

              <div
                className="rounded-2xl p-3.5 border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <span className="text-[11px] block font-semibold" style={{ color: "#bfdbfe" }}>Marks Ledger</span>
                <span className="text-xl sm:text-2xl font-black block" style={{ color: "#ffffff" }}>{totalMarks}</span>
                <span className="text-[10px] block font-bold" style={{ color: "#fde047" }}>Graded Entries</span>
              </div>

              <div
                className="rounded-2xl p-3.5 border"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <span className="text-[11px] block font-semibold" style={{ color: "#bfdbfe" }}>Print Standards</span>
                <span className="text-xl sm:text-2xl font-black block" style={{ color: "#ffffff" }}>300 DPI</span>
                <span className="text-[10px] block font-bold" style={{ color: "#6ee7b7" }}>A4 & PVC Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Administrative Modules Grid (Large Clickable Cards) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-black tracking-tight flex items-center gap-2"
                style={{ color: "#0f172a" }}
              >
                <Layers className="w-5 h-5" style={{ color: "#0f2e60" }} />
                <span>Primary Operational Modules</span>
              </h2>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Core daily workflows for school administrative staff, registrars, and faculty.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: New Admission Form */}
            <Link
              href="/admission"
              className="group rounded-3xl border-2 p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#fecdd3",
              }}
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                  >
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <span
                    className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: "#fff1f2",
                      color: "#991b1b",
                      borderColor: "#fecdd3",
                    }}
                  >
                    MODULE 1
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black transition-colors" style={{ color: "#0f172a" }}>
                    New Admission Form
                  </h3>
                  <p className="text-xs font-bold" style={{ color: "#991b1b" }}>
                    Student Enrollment & S.R. Folio Creation
                  </p>
                </div>

                <p className="text-xs leading-relaxed font-normal" style={{ color: "#475569" }}>
                  Enroll incoming scholars with complete demographic tracking, parent/guardian profiles, medical records, and local offline document enclosures (Birth Certificate, Aadhaar Card, TC).
                </p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Auto S.R. Number
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Document Archiving
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Parent Ledger
                  </span>
                </div>
              </div>

              <div
                className="pt-4 border-t flex items-center justify-between text-xs font-bold transition-transform group-hover:translate-x-1"
                style={{ borderColor: "#f1f5f9", color: "#991b1b" }}
              >
                <span>Launch Admission Portal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 2: Master Student Directory */}
            <Link
              href="/directory"
              className="group rounded-3xl border-2 p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#bfdbfe",
              }}
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: "#dbeafe", color: "#0f2e60" }}
                  >
                    <Users className="w-7 h-7" />
                  </div>
                  <span
                    className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#0f2e60",
                      borderColor: "#bfdbfe",
                    }}
                  >
                    MODULE 2
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black transition-colors" style={{ color: "#0f172a" }}>
                    Student Directory
                  </h3>
                  <p className="text-xs font-bold" style={{ color: "#0f2e60" }}>
                    Master Roster, S.R. Folios & ID Badges
                  </p>
                </div>

                <p className="text-xs leading-relaxed font-normal" style={{ color: "#475569" }}>
                  Search, filter, and inspect all active scholars across Nursery, Pre-Primary, Primary, and Middle grades. Launch 1-click S.R. Back Pages, Report Cards, and printable ID Badges.
                </p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Real-time Search
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    S.R. Back Page (10-Yr)
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    ID Badge Generator
                  </span>
                </div>
              </div>

              <div
                className="pt-4 border-t flex items-center justify-between text-xs font-bold transition-transform group-hover:translate-x-1"
                style={{ borderColor: "#f1f5f9", color: "#0f2e60" }}
              >
                <span>Open Master Directory</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 3: Accumulative Marks Register */}
            <Link
              href="/registers/data-entry"
              className="group rounded-3xl border-2 p-7 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-6 relative overflow-hidden hover:-translate-y-1"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#a7f3d0",
              }}
            >
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: "#d1fae5", color: "#065f46" }}
                  >
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <span
                    className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      borderColor: "#a7f3d0",
                    }}
                  >
                    MODULE 3
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black transition-colors" style={{ color: "#0f172a" }}>
                    Accumulative Marks Register
                  </h3>
                  <p className="text-xs font-bold" style={{ color: "#065f46" }}>
                    Bulk Marks Ledger & Auto Grading Grid
                  </p>
                </div>

                <p className="text-xs leading-relaxed font-normal" style={{ color: "#475569" }}>
                  High-speed Excel-style bulk data entry ledger for Unit Tests, Half-Yearly, and Annual Examinations across Formats A, B & C with live dynamic grand totals and CBSE grade scoring.
                </p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Bulk Fast Entry
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Auto Aggregates
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{ backgroundColor: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" }}
                  >
                    Formats A, B & C
                  </span>
                </div>
              </div>

              <div
                className="pt-4 border-t flex items-center justify-between text-xs font-bold transition-transform group-hover:translate-x-1"
                style={{ borderColor: "#f1f5f9", color: "#065f46" }}
              >
                <span>Open Marks Data Entry Grid</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

          </div>
        </section>

        {/* Secondary Modules: Official Document Generators */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-lg font-bold tracking-tight flex items-center gap-2"
                style={{ color: "#0f172a" }}
              >
                <Printer className="w-4 h-4" style={{ color: "#4f46e5" }} />
                <span>Official Documents & Evaluation Booklets</span>
              </h3>
              <p className="text-xs" style={{ color: "#64748b" }}>
                1-Click print-ready forms formatted to official school and board standards.
              </p>
            </div>
            <Link
              href="/directory"
              className="text-xs font-bold hover:underline flex items-center gap-1"
              style={{ color: "#0f2e60" }}
            >
              <span>View All via Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">

            {/* Doc 1: S.R. Front Folio */}
            <Link
              href="/directory"
              className="p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <span
                  className="text-[9.5px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  Front Folio
                </span>
              </div>
              <h4 className="font-bold text-xs" style={{ color: "#0f172a" }}>
                S.R. Front Page
              </h4>
              <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                Official scholar registration ledger folio with parental records & proofs.
              </p>
            </Link>

            {/* Doc 2: S.R. Back Page */}
            <Link
              href="/directory"
              className="p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#ecfdf5", color: "#065f46" }}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <span
                  className="text-[9.5px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  10-Yr Folio
                </span>
              </div>
              <h4 className="font-bold text-xs" style={{ color: "#0f172a" }}>
                S.R. Back Page
              </h4>
              <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                Permanent 10-year academic progression ledger for physical Scholar Register books.
              </p>
            </Link>

            {/* Doc 2: Pre-Primary Report Card */}
            <Link
              href="/directory"
              className="p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#fff1f2", color: "#991b1b" }}
                >
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  4-Page Booklet
                </span>
              </div>
              <h4 className="font-bold text-sm" style={{ color: "#0f172a" }}>
                Pre-Primary Assessment
              </h4>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                4-tier official evaluation booklet with Star ratings and developmental traits.
              </p>
            </Link>

            {/* Doc 3: Lower Primary & Mid-Levels */}
            <Link
              href="/directory"
              className="p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#eff6ff", color: "#0f2e60" }}
                >
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  Classes I – VIII
                </span>
              </div>
              <h4 className="font-bold text-sm" style={{ color: "#0f172a" }}>
                Primary & Junior Cards
              </h4>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                Single-page progress reports covering 4-term academic splits & domain traits.
              </p>
            </Link>

            {/* Doc 4: Student ID Badges */}
            <Link
              href="/directory"
              className="p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all group"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#f1f5f9", color: "#1e293b" }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                >
                  PVC / 8-Up Sheet
                </span>
              </div>
              <h4 className="font-bold text-sm" style={{ color: "#0f172a" }}>
                Student ID Cards
              </h4>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "#64748b" }}>
                Print single student badges or 8-up batch sheets for PVC laminations.
              </p>
            </Link>

          </div>
        </section>

        {/* Recently Admitted Scholars Quick Roster */}
        {recentStudents.length > 0 && (
          <section
            className="rounded-3xl border p-6 sm:p-8 shadow-xs space-y-4"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "#f1f5f9" }}>
              <div>
                <h3
                  className="font-bold text-base flex items-center gap-2"
                  style={{ color: "#0f172a" }}
                >
                  <Clock className="w-4 h-4" style={{ color: "#059669" }} />
                  <span>Recently Enrolled Scholars</span>
                </h3>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Quick access to latest admission entries and their official records.
                </p>
              </div>
              <Link
                href="/directory"
                className="text-xs font-bold hover:underline flex items-center gap-1"
                style={{ color: "#0f2e60" }}
              >
                <span>Full Directory ({totalStudents})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {recentStudents.map((student) => {
                const session = student.academicSessions[0];
                const father = student.parents.find(
                  (p) => p.relationType?.toLowerCase() === "father"
                ) || student.parents[0];

                return (
                  <div
                    key={student.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-xl transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                        style={{
                          backgroundColor: "#f1f5f9",
                          borderColor: "#cbd5e1",
                          color: "#334155",
                        }}
                      >
                        {student.photoPath ? (
                          <img
                            src={getEnclosureUrl(student.photoPath)}
                            alt={student.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: "#0f172a" }}>
                            {student.firstName} {student.lastName}
                          </span>
                          <span
                            className="font-mono text-[11px] font-bold px-2 py-0.2 rounded border"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              borderColor: "#bfdbfe",
                            }}
                          >
                            {student.srNumber}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#64748b" }}>
                          Class: <strong style={{ color: "#1e293b" }}>{session?.className || "NURSERY"}</strong> • Father: <span style={{ color: "#1e293b" }}>{father ? `${father.firstName} ${father.lastName}`.trim() : "—"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Fast Access Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <Link
                        href={`/students/${encodeURIComponent(student.srNumber)}/sr-back-page`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "#ecfdf5",
                          color: "#065f46",
                          borderColor: "#a7f3d0",
                        }}
                        title="View S.R. Back Page"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        S.R. Back
                      </Link>
                      <Link
                        href={`/students/${encodeURIComponent(student.srNumber)}/id-card`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          borderColor: "#cbd5e1",
                        }}
                        title="Print ID Card"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        ID Card
                      </Link>
                      <Link
                        href={`/student/${encodeURIComponent(student.srNumber)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 hover:underline"
                        style={{ color: "#0f2e60" }}
                      >
                        Profile →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Institutional Footer */}
      <footer
        className="border-t mt-12 py-6 text-xs"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e2e8f0",
          color: "#64748b",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: "#991b1b" }} />
            <span className="font-bold" style={{ color: "#0f172a" }}>Town Hall Public High School</span>
            <span>•</span>
            <span>Kundari Rakabganj, Ramapuram, Lucknow - 226004</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Helpline: <strong style={{ color: "#0f172a" }}>9235445596</strong></span>
            <span>•</span>
            <span className="font-semibold" style={{ color: "#065f46" }}>Standalone Offline-First Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
