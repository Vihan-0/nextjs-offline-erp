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
  Home,
  Sliders,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  PrePrimaryReportCard,
  type PrePrimaryReportCardData,
  PRE_PRIMARY_CURRICULUM,
} from "./PrePrimaryReportCard";
import { saveReportCardOverrideAction } from "@/actions/saveAccumulativeMarks";

interface PrePrimaryReportCardClientProps {
  student: PrePrimaryReportCardData;
}

export function PrePrimaryReportCardClient({
  student: initialStudent,
}: PrePrimaryReportCardClientProps) {
  const [studentData, setStudentData] = useState<PrePrimaryReportCardData>(initialStudent);
  const [scale, setScale] = useState<number>(0.95);
  const [copied, setCopied] = useState(false);

  // Auto-open editor if any assessment grade is missing (so staff immediately see the editable panel)
  const hasMissingGrades = React.useMemo(() => {
    if (!initialStudent.assessments || Object.keys(initialStudent.assessments).length === 0) return true;
    return Object.values(initialStudent.assessments).some(
      (g) => !g || (!g.term1 && !g.term2 && !g.term3 && !g.term4)
    );
  }, [initialStudent]);
  const [isEditorOpen, setIsEditorOpen] = useState(hasMissingGrades);

  // Persistence & Maker-Checker State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // A4 Portrait Print Handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pre_Primary_Report_Card_${studentData.srNumber}_${studentData.studentName.replace(/\s+/g, "_")}`,
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
        .pre-primary-report-card-root {
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
    const text = `Pre-Primary Progress Report: ${studentData.studentName} (S.R. No: ${studentData.srNumber}, Class: ${studentData.classAndSection}, DoB: ${studentData.dateOfBirth})`;
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

  // Save changes to database and request Director Maker-Checker Sign-off
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const result = await saveReportCardOverrideAction({
        srNumber: studentData.srNumber,
        className: studentData.classAndSection.split("-")[0].trim() || "PRE - PRIMARY",
        sessionYear: studentData.sessionYear || "2026-2027",
        grades: studentData.assessments,
        attendanceAnnual: studentData.attendance?.total || "",
        teacherRemark: studentData.teacherRemark,
        passedAndPromotedToClass: studentData.passedAndPromotedToClass,
      });

      if (result.success) {
        setSaveStatus({
          success: true,
          message: result.message || "Pre-Primary report card saved and submitted to Director's clearance queue.",
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
    <div className="min-h-screen bg-stone-900 flex flex-col font-sans text-stone-100 pb-16">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors shrink-0 border border-stone-800"
              title="Return to Home Dashboard"
            >
              <Home className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href={`/students/${encodeURIComponent(studentData.srNumber)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors shrink-0 border border-stone-800"
              title="Return to Student Profile"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <div className="h-4 w-px bg-stone-800 hidden sm:block" />
            <div className="truncate">
              <h1 className="text-sm font-black text-stone-100 flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="truncate">Pre-Primary Progress Report (Nursery – U.K.G.)</span>
              </h1>
              <p className="text-[11px] text-stone-400 font-mono truncate">
                S.R. No: <strong>{studentData.srNumber}</strong> • {studentData.studentName}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Editor Toggle */}
            <button
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isEditorOpen
                  ? "bg-amber-950/60 border-amber-800/60 text-amber-300"
                  : "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEditorOpen ? "Close Editor" : "Tweak Evaluation"}</span>
              {isEditorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Save & Submit for Director Sign-Off */}
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border border-emerald-600"
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

            {/* Print Button */}
            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0f2e60] hover:bg-[#1a3e7a] text-white shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
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

      {/* Collapsible Live Editor Drawer */}
      {isEditorOpen && (
        <div className="bg-stone-950 border-b border-stone-800 p-5 shadow-xl animate-in slide-in-from-top-2 duration-200 no-print text-stone-100">
          <div className="max-w-7xl mx-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Pre-Primary Performance & Remarks Editor (Maker-Checker Enabled)
                </h3>
                <p className="text-xs text-stone-400">
                  Update stars, remarks, attendance, and promotion status. Changes save to SQLite and queue for Director clearance.
                </p>
              </div>
            </div>

            {/* Quick Fill Helpers */}
            <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3 flex-wrap">
              <span className="text-xs font-semibold text-stone-400">Quick Fill All Metrics:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const updated: Record<string, { term1: string; term2: string; term3: string; term4: string }> = {};
                    PRE_PRIMARY_CURRICULUM.forEach((cat) => {
                      cat.items.forEach((item) => {
                        updated[item] = { term1: "****", term2: "****", term3: "****", term4: "****" };
                      });
                    });
                    setStudentData((prev) => ({ ...prev, assessments: updated }));
                  }}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800/60 transition-colors cursor-pointer"
                >
                  ★★★★ (4 Stars)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated: Record<string, { term1: string; term2: string; term3: string; term4: string }> = {};
                    PRE_PRIMARY_CURRICULUM.forEach((cat) => {
                      cat.items.forEach((item) => {
                        updated[item] = { term1: "***", term2: "***", term3: "***", term4: "***" };
                      });
                    });
                    setStudentData((prev) => ({ ...prev, assessments: updated }));
                  }}
                  className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-bold rounded-lg border border-blue-800/60 transition-colors cursor-pointer"
                >
                  ★★★ (3 Stars)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated: Record<string, { term1: string; term2: string; term3: string; term4: string }> = {};
                    PRE_PRIMARY_CURRICULUM.forEach((cat) => {
                      cat.items.forEach((item) => {
                        updated[item] = { term1: "**", term2: "**", term3: "**", term4: "**" };
                      });
                    });
                    setStudentData((prev) => ({ ...prev, assessments: updated }));
                  }}
                  className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-bold rounded-lg border border-amber-800/60 transition-colors cursor-pointer"
                >
                  ★★ (2 Stars)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated: Record<string, { term1: string; term2: string; term3: string; term4: string }> = {};
                    PRE_PRIMARY_CURRICULUM.forEach((cat) => {
                      cat.items.forEach((item) => {
                        updated[item] = { term1: "*", term2: "*", term3: "*", term4: "*" };
                      });
                    });
                    setStudentData((prev) => ({ ...prev, assessments: updated }));
                  }}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/60 transition-colors cursor-pointer"
                >
                  ★ (1 Star)
                </button>
              </div>
            </div>

            {/* Individual Curriculum Domain Evaluator */}
            <div className="border border-stone-800 rounded-2xl bg-stone-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="font-bold text-rose-300 uppercase tracking-wider text-xs">
                  Early Childhood Foundation Categories
                </h4>
                <span className="text-[11px] text-stone-400 font-mono">Terms: I • II • III • IV</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRE_PRIMARY_CURRICULUM.map((cat) => (
                  <div key={cat.category} className="bg-stone-950/80 p-3 rounded-xl border border-stone-800/80 space-y-2">
                    <h5 className="font-bold text-amber-300 text-[11px] border-b border-stone-800/60 pb-1">
                      {cat.category}
                    </h5>
                    <div className="space-y-2">
                      {cat.items.map((item) => {
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
                                  value={g[term] || "****"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentData((prev) => {
                                      const current = prev.assessments || {};
                                      const row = current[item] || {};
                                      return {
                                        ...prev,
                                        assessments: {
                                          ...current,
                                          [item]: {
                                            ...row,
                                            [term]: val,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                  className="bg-stone-900 border border-stone-700 text-amber-300 font-bold rounded px-0.5 py-0.5 text-center text-[10px] focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                                  title={`Term ${idx + 1}`}
                                >
                                  <option value="****">★★★★</option>
                                  <option value="***">★★★</option>
                                  <option value="**">★★</option>
                                  <option value="*">★</option>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block font-bold text-stone-300 mb-1">Teacher's Remark</label>
                <input
                  type="text"
                  value={studentData.teacherRemark || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({ ...prev, teacherRemark: e.target.value }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Enthusiastic & Creative"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Attendance Summary</label>
                <input
                  type="text"
                  value={studentData.attendance?.total || ""}
                  onChange={(e) =>
                    setStudentData((prev) => ({
                      ...prev,
                      attendance: { ...(prev.attendance || {}), total: e.target.value },
                    }))
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 font-medium text-stone-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 185 / 195 Days"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-300 mb-1">Promoted To Class</label>
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
                  placeholder="e.g. L.K.G."
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-center">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="shrink-0 shadow-2xl rounded-sm"
          >
            <div ref={printRef}>
              <PrePrimaryReportCard data={studentData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
