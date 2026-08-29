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
  User,
  Share2,
  Check,
  Building2,
  Sparkles,
  FileCheck2,
  Calendar,
  GraduationCap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Home,
  Save,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  LowerPrimaryReportCard,
  type LowerPrimaryReportCardData,
  LOWER_PRIMARY_ACADEMIC_SUBJECTS,
  LOWER_PRIMARY_DEVELOPMENTAL,
} from "./LowerPrimaryReportCard";
import { saveReportCardOverrideAction } from "@/actions/saveAccumulativeMarks";

interface LowerPrimaryReportCardClientProps {
  student: LowerPrimaryReportCardData;
}

export function LowerPrimaryReportCardClient({
  student: initialStudent,
}: LowerPrimaryReportCardClientProps) {
  const [studentData, setStudentData] = useState<LowerPrimaryReportCardData>(initialStudent);
  const [scale, setScale] = useState<number>(0.95);
  const [copied, setCopied] = useState(false);

  // Auto-open editor if any assessment grade is missing
  const hasMissingGrades = React.useMemo(() => {
    if (!initialStudent.assessments) return true;
    const allKeys: string[] = [];
    LOWER_PRIMARY_ACADEMIC_SUBJECTS.left.forEach((s) => s.components.forEach((c) => allKeys.push(`${s.subject} - ${c}`)));
    LOWER_PRIMARY_ACADEMIC_SUBJECTS.right.forEach((s) => s.components.forEach((c) => allKeys.push(`${s.subject} - ${c}`)));
    return allKeys.some((key) => {
      const g = initialStudent.assessments?.[key];
      return !g || (!g.term1 && !g.term2 && !g.term3 && !g.term4);
    });
  }, [initialStudent]);
  const [isEditorOpen, setIsEditorOpen] = useState(hasMissingGrades);

  // Persistence & Maker-Checker State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // A4 Portrait Print Handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Lower_Primary_Report_Card_${studentData.srNumber}_${studentData.studentName.replace(/\s+/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 4mm 2mm;
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
        .lower-primary-report-card-root {
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
    const text = `Lower Primary Progress Report: ${studentData.studentName} (S.R. No: ${studentData.srNumber}, Class: ${studentData.classAndSection}, DoB: ${studentData.dateOfBirth})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Grade update helpers
  const handleGradeChange = (
    key: string,
    term: "term1" | "term2" | "term3" | "term4",
    value: string
  ) => {
    setStudentData((prev) => {
      const current = prev.assessments || {};
      const row = current[key] || {};
      return {
        ...prev,
        assessments: {
          ...current,
          [key]: {
            ...row,
            [term]: value,
          },
        },
      };
    });
  };

  const handleBulkFill = (grade: "A+" | "A" | "B" | "C") => {
    setStudentData((prev) => {
      const updated: Record<string, { term1: string; term2: string; term3: string; term4: string }> = {};

      // Academic left
      LOWER_PRIMARY_ACADEMIC_SUBJECTS.left.forEach((subj) => {
        subj.components.forEach((comp) => {
          updated[`${subj.subject} - ${comp}`] = {
            term1: grade,
            term2: grade,
            term3: grade,
            term4: grade,
          };
        });
      });

      // Academic right
      LOWER_PRIMARY_ACADEMIC_SUBJECTS.right.forEach((subj) => {
        subj.components.forEach((comp) => {
          updated[`${subj.subject} - ${comp}`] = {
            term1: grade,
            term2: grade,
            term3: grade,
            term4: grade,
          };
        });
      });

      // Developmental
      LOWER_PRIMARY_DEVELOPMENTAL.forEach((area) => {
        area.items.forEach((item) => {
          updated[item] = {
            term1: grade,
            term2: grade,
            term3: grade,
            term4: grade,
          };
        });
      });

      return {
        ...prev,
        assessments: updated,
      };
    });
  };

  // Save changes to database and request Director Maker-Checker Sign-off
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const result = await saveReportCardOverrideAction({
        srNumber: studentData.srNumber,
        className: studentData.classAndSection.split("-")[0].trim() || "CLASS I",
        sessionYear: studentData.sessionYear || "2026-2027",
        grades: studentData.assessments,
        attendanceAnnual: studentData.attendance,
        teacherRemark: studentData.teacherRemark,
        passedAndPromotedToClass: studentData.passedAndPromotedToClass,
      });

      if (result.success) {
        setSaveStatus({
          success: true,
          message: result.message || "Lower primary report card saved and submitted to Director's clearance queue.",
        });
      } else {
        setSaveStatus({
          success: false,
          message: result.error || "Failed to save report card changes.",
        });
      }
    } catch (err) {
      setSaveStatus({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="bg-stone-950/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-40 px-4 py-3 shadow-md no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors border border-stone-800"
            >
              <Home className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href={`/students/${encodeURIComponent(studentData.srNumber)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors border border-stone-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scholar Profile</span>
            </Link>
            <div className="h-4 w-px bg-stone-800 hidden sm:block" />
            <div>
              <h1 className="text-sm font-black text-stone-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Lower Primary Report Card (Classes I – III)</span>
              </h1>
              <p className="text-[11px] text-stone-400 font-mono">
                S.R. No: <strong>{studentData.srNumber}</strong> • {studentData.studentName}
              </p>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Editor Toggle */}
            <button
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isEditorOpen
                  ? "bg-amber-950/60 border-amber-800/60 text-amber-300"
                  : "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditorOpen ? "Close Editor" : "Tweak Grades"}</span>
              {isEditorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Save & Submit for Director Sign-Off */}
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border border-emerald-600"
              title="Save changes to SQLite & queue for Director Maker-Checker Sign-off"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Submit</span>
                </>
              )}
            </button>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-stone-900 p-0.5 rounded-xl border border-stone-800">
              <button
                onClick={() => setScale((s) => Math.max(0.6, s - 0.05))}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono px-2 text-stone-300 select-none">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(1.3, s + 0.05))}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(0.95)}
                className="p-1.5 text-stone-500 hover:text-stone-300 rounded hover:bg-stone-800 transition-colors border-l border-stone-800 ml-0.5 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 bg-[#0f2e60] hover:bg-[#1a3e7a] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer border border-blue-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report Card</span>
            </button>
          </div>
        </div>
      </header>

      {/* Governance & Save Feedback Banner */}
      {saveStatus && (
        <div
          className={`max-w-7xl mx-auto w-full mt-4 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between border no-print ${
            saveStatus.success
              ? "bg-emerald-950/80 text-emerald-200 border-emerald-800"
              : "bg-rose-950/80 text-rose-200 border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.success ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-stone-400 hover:text-stone-200 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Live Editor Drawer / Panel */}
      {isEditorOpen && (
        <div className="bg-stone-950 border-b border-stone-800 p-5 shadow-xl animate-in slide-in-from-top-2 duration-200 no-print text-stone-100">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Live Grades & Evaluation Editor (Maker-Checker Enabled)
                </h3>
                <p className="text-xs text-stone-400">
                  Quickly set grades (A+, A, B, C) and remarks. Changes save to SQLite and queue for Director clearance.
                </p>
              </div>

              {/* Bulk Fill Helpers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-400">Quick Fill All:</span>
                <button
                  onClick={() => handleBulkFill("A+")}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800/60 transition-colors cursor-pointer"
                >
                  A+ (Best)
                </button>
                <button
                  onClick={() => handleBulkFill("A")}
                  className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-bold rounded-lg border border-blue-800/60 transition-colors cursor-pointer"
                >
                  A (Very Good)
                </button>
                <button
                  onClick={() => handleBulkFill("B")}
                  className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-bold rounded-lg border border-amber-800/60 transition-colors cursor-pointer"
                >
                  B (Good)
                </button>
                <button
                  onClick={() => handleBulkFill("C")}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/60 transition-colors cursor-pointer"
                >
                  C (Needs Attention)
                </button>
              </div>
            </div>

            {/* Comprehensive Subject & Developmental Grade Tweaker */}
            <div className="border border-stone-800 rounded-2xl bg-stone-900/60 p-4 space-y-4">
              {/* 1. Academic Subjects */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <h4 className="font-bold text-blue-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <span>1. Academic Subjects Evaluation</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-mono">Terms: I • II • III • IV</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: English, Hindi, Mathematics */}
                  <div className="space-y-2 bg-stone-950/80 p-3 rounded-xl border border-stone-800/80">
                    <div className="text-[11px] font-bold text-stone-400 flex justify-between px-1">
                      <span>SUBJECT / COMPONENT</span>
                      <div className="grid grid-cols-4 gap-1.5 w-48 text-center font-mono">
                        <span>T1</span>
                        <span>T2</span>
                        <span>T3</span>
                        <span>T4</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 divide-y divide-stone-800/40">
                      {LOWER_PRIMARY_ACADEMIC_SUBJECTS.left.map((subj) =>
                        subj.components.map((comp) => {
                          const key = `${subj.subject} - ${comp}`;
                          const g = studentData.assessments?.[key] || {};
                          return (
                            <div key={key} className="flex items-center justify-between pt-1 text-xs">
                              <span className="font-semibold text-stone-200 truncate pr-2" title={key}>
                                <strong className="text-amber-300 font-normal">{subj.subject}:</strong> {comp}
                              </span>
                              <div className="grid grid-cols-4 gap-1.5 w-48 shrink-0">
                                {(["term1", "term2", "term3", "term4"] as const).map((term) => (
                                  <select
                                    key={term}
                                    value={g[term] || "A+"}
                                    onChange={(e) => handleGradeChange(key, term, e.target.value)}
                                    className="bg-stone-900 border border-stone-700 text-amber-300 font-bold rounded-md px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                                  >
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                  </select>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: EVS, General Awareness, Computer, Art & Craft, PT/Game */}
                  <div className="space-y-2 bg-stone-950/80 p-3 rounded-xl border border-stone-800/80">
                    <div className="text-[11px] font-bold text-stone-400 flex justify-between px-1">
                      <span>SUBJECT / COMPONENT</span>
                      <div className="grid grid-cols-4 gap-1.5 w-48 text-center font-mono">
                        <span>T1</span>
                        <span>T2</span>
                        <span>T3</span>
                        <span>T4</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 divide-y divide-stone-800/40">
                      {LOWER_PRIMARY_ACADEMIC_SUBJECTS.right.map((subj) =>
                        subj.components.map((comp) => {
                          const key = subj.subject === "PT/Game" ? "PT/Game" : `${subj.subject} - ${comp.replace(/\n/g, " ")}`;
                          const g = studentData.assessments?.[key] || {};
                          return (
                            <div key={key} className="flex items-center justify-between pt-1 text-xs">
                              <span className="font-semibold text-stone-200 truncate pr-2" title={key}>
                                <strong className="text-amber-300 font-normal">{subj.subject}:</strong> {comp.replace(/\n/g, "/")}
                              </span>
                              <div className="grid grid-cols-4 gap-1.5 w-48 shrink-0">
                                {(["term1", "term2", "term3", "term4"] as const).map((term) => (
                                  <select
                                    key={term}
                                    value={g[term] || "A+"}
                                    onChange={(e) => handleGradeChange(key, term, e.target.value)}
                                    className="bg-stone-900 border border-stone-700 text-amber-300 font-bold rounded-md px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                                  >
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                  </select>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Developmental Domains */}
              <div className="space-y-3 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <span>2. Developmental Domains & Personal Traits</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-mono">Terms: I • II • III • IV</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {LOWER_PRIMARY_DEVELOPMENTAL.map((domain) => (
                    <div key={domain.category} className="bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 space-y-2">
                      <h5 className="font-bold text-stone-300 text-[11px] border-b border-stone-800/60 pb-1">
                        {domain.category}
                      </h5>
                      <div className="space-y-2">
                        {domain.items.map((item) => {
                          const g = studentData.assessments?.[item] || {};
                          return (
                            <div key={item} className="space-y-1">
                              <span className="block text-[10.5px] font-medium text-stone-300 truncate" title={item}>
                                {item}
                              </span>
                              <div className="grid grid-cols-4 gap-1">
                                {(["term1", "term2", "term3", "term4"] as const).map((term, idx) => (
                                  <select
                                    key={term}
                                    value={g[term] || "A+"}
                                    onChange={(e) => handleGradeChange(item, term, e.target.value)}
                                    className="bg-stone-900 border border-stone-700 text-stone-200 font-bold rounded px-0.5 py-0.5 text-center text-[10px] focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                                    title={`Term ${idx + 1}`}
                                  >
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                  </select>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <label className="block font-bold text-stone-300 mb-1">Teacher's Remark</label>
                <input
                  type="text"
                  value={studentData.teacherRemark || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({ ...prev, teacherRemark: e.target.value }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. CONFIDENT & OUTSTANDING"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Attendance Summary</label>
                <input
                  type="text"
                  value={studentData.attendance || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({ ...prev, attendance: e.target.value }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 188 / 198 Days (95%)"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Passed & Promoted To</label>
                <input
                  type="text"
                  value={studentData.passedAndPromotedToClass || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({
                      ...prev,
                      passedAndPromotedToClass: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. CLASS III"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">School Reopen Date</label>
                <input
                  type="text"
                  value={studentData.schoolReopenOn || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({
                      ...prev,
                      schoolReopenOn: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 01.07.2026"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        {/* Printable Viewport Container */}
        <div
          className="transition-transform duration-150 origin-top flex justify-center shadow-2xl rounded-sm"
          style={{ transform: `scale(${scale})` }}
        >
          <div ref={printRef} className="bg-white">
            <LowerPrimaryReportCard data={studentData} />
          </div>
        </div>
      </main>
    </div>
  );
}
