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
  BookOpen,
  Home,
  Save,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  MidLevelsReportCard,
  type MidLevelsReportCardData,
  type ReportCardLevel,
  UPPER_PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS,
  CO_SCHOLASTIC_ACTIVITIES,
} from "./MidLevelsReportCard";
import {
  saveReportCardOverrideAction,
  updateStudentSubjectMark,
  updateStudentSoftSkillMark,
} from "@/actions/saveAccumulativeMarks";

interface MidLevelsReportCardClientProps {
  student: MidLevelsReportCardData;
}

export function MidLevelsReportCardClient({
  student: initialStudent,
}: MidLevelsReportCardClientProps) {
  const [studentData, setStudentData] = useState<MidLevelsReportCardData>(initialStudent);
  const [scale, setScale] = useState<number>(0.95);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);

  // Auto-open editor if any subject has missing marks (so it's immediately obvious to staff)
  const hasMissingMarks = React.useMemo(() => {
    const subjects = initialStudent.level === "junior" ? JUNIOR_SUBJECTS : UPPER_PRIMARY_SUBJECTS;
    return subjects.some((subj) => {
      const m = initialStudent.subjectMarks?.[subj];
      return !m || (m.ut1 === "" || m.ut1 === undefined) || (m.annual === "" || m.annual === undefined);
    });
  }, [initialStudent]);
  const [isEditorOpen, setIsEditorOpen] = useState(hasMissingMarks);

  // Persistence & Maker-Checker State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // A4 Portrait Print Handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${studentData.level === 'junior' ? 'Junior' : 'Upper_Primary'}_Report_Card_${studentData.srNumber}_${studentData.studentName.replace(/\s+/g, "_")}`,
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
        .mid-levels-report-card-root {
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
    const levelLabel = studentData.level === 'junior' ? 'Junior' : 'Upper Primary';
    const text = `${levelLabel} Progress Report: ${studentData.studentName} (S.R. No: ${studentData.srNumber}, Class: ${studentData.classAndSection}, DoB: ${studentData.dateOfBirth})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Toggle Level (Upper Primary <-> Junior)
  const handleLevelChange = (newLevel: ReportCardLevel) => {
    setHasUnsavedChanges(true);
    setStudentData((prev) => ({
      ...prev,
      level: newLevel,
      passedAndPromotedToClass:
        newLevel === "junior"
          ? (prev.passedAndPromotedToClass?.includes("VI") ? "CLASS IX" : prev.passedAndPromotedToClass)
          : (prev.passedAndPromotedToClass?.includes("IX") ? "CLASS VI" : prev.passedAndPromotedToClass),
    }));
  };

  // Marks update helpers
  const handleMarkChange = (
    subject: string,
    field: "ut1" | "halfYearly" | "ut2" | "annual",
    value: string
  ) => {
    setHasUnsavedChanges(true);
    setStudentData((prev) => {
      const current = prev.subjectMarks || {};
      const row = current[subject] || {};
      return {
        ...prev,
        subjectMarks: {
          ...current,
          [subject]: {
            ...row,
            [field]: value === "" ? "" : isNaN(Number(value)) ? value : Number(value),
          },
        },
      };
    });
  };

  // Live onBlur Auto-Save for Inline Report Card Editing
  const handleMarkBlur = async (
    subject: string,
    field: "ut1" | "halfYearly" | "ut2" | "annual",
    value: string
  ) => {
    let examType = "Unit Test 1";
    let maxMarks = 30;
    if (field === "halfYearly") {
      examType = "Half Yearly";
      maxMarks = 70;
    } else if (field === "ut2") {
      examType = "Unit Test 2";
      maxMarks = 30;
    } else if (field === "annual") {
      examType = "Annual";
      maxMarks = 70;
    }

    setAutoSaveStatus(`Syncing ${subject} (${examType})...`);
    try {
      const res = await updateStudentSubjectMark({
        studentSrNumber: studentData.srNumber,
        subjectId: subject,
        examType,
        marksObtained: value === "" ? null : value,
        maxMarks,
        className: studentData.classAndSection.split("-")[0].trim() || (studentData.level === "junior" ? "CLASS VI" : "CLASS V"),
        sessionYear: studentData.sessionYear || "2026-2027",
      });

      if (res.success) {
        setAutoSaveStatus(`Saved: ${subject} score live synced`);
        setTimeout(() => setAutoSaveStatus(null), 3000);
      } else {
        setAutoSaveStatus(`Error saving mark: ${res.error}`);
      }
    } catch {
      setAutoSaveStatus("Network error syncing mark");
    }
  };

  // Co-Scholastic Grade Handler with Live Database Auto-Save
  const handleGradeChange = async (
    activity: string,
    term: "halfYearly" | "annual",
    value: string
  ) => {
    setHasUnsavedChanges(true);
    setStudentData((prev) => {
      const current = prev.grades || {};
      const row = current[activity] || {};
      return {
        ...prev,
        grades: {
          ...current,
          [activity]: {
            ...row,
            [term]: value,
          },
        },
      };
    });

    setAutoSaveStatus(`Syncing Grade: ${activity} (${term === "halfYearly" ? "Half Yearly" : "Annual"})...`);
    try {
      const res = await updateStudentSoftSkillMark({
        studentSrNumber: studentData.srNumber,
        skillName: activity,
        term: term === "halfYearly" ? "Half Yearly" : "Annual",
        grade: value,
        className: studentData.classAndSection.split("-")[0].trim() || (studentData.level === "junior" ? "CLASS VI" : "CLASS V"),
        sessionYear: studentData.sessionYear || "2026-2027",
      });

      if (res.success) {
        setAutoSaveStatus(`Saved: ${activity} grade (${value}) live synced`);
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    } catch {
      setAutoSaveStatus("Network error syncing grade");
    }
  };

  // Save changes to database and request Director Maker-Checker Sign-off
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const result = await saveReportCardOverrideAction({
        srNumber: studentData.srNumber,
        className: studentData.classAndSection.split("-")[0].trim() || (studentData.level === "junior" ? "CLASS VI" : "CLASS V"),
        sessionYear: studentData.sessionYear || "2026-2027",
        subjectMarks: studentData.subjectMarks,
        grades: studentData.grades,
        attendanceHalfYearly: studentData.attendanceHalfYearly,
        attendanceAnnual: studentData.attendanceAnnual,
        rankInClass: studentData.rankInClass,
        teacherRemark: studentData.teacherRemark,
        passedAndPromotedToClass: studentData.passedAndPromotedToClass,
      });

      if (result.success) {
        setSaveStatus({
          success: true,
          message: result.message || "Report card updated & submitted to Director's clearance queue.",
        });
        setHasUnsavedChanges(false);
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
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center py-6 px-2 sm:px-4 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Floating Action Bar */}
      <header className="w-full max-w-[210mm] mb-5 bg-stone-950/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 no-print sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <Link
            href={`/students/${encodeURIComponent(studentData.srNumber)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-300 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors"
            title="Back to Scholar Profile"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <div className="h-4 w-px bg-stone-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-extrabold text-stone-100 tracking-tight flex items-center gap-1.5 font-serif">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{studentData.level === 'junior' ? 'Junior' : 'Upper Primary'} Report Card</span>
            </h1>
          </div>
        </div>

        {/* Level Toggle Pill */}
        <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => handleLevelChange('upper-primary')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              studentData.level === 'upper-primary'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Upper Primary (IV–V)
          </button>
          <button
            onClick={() => handleLevelChange('junior')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              studentData.level === 'junior'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Junior (VI–VIII)
          </button>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Buttons (Hidden on print) */}
          <div className="hidden md:flex items-center bg-stone-900 rounded-xl p-0.5 border border-stone-800">
            <button
              onClick={() => setScale((s) => Math.max(0.7, s - 0.05))}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-stone-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.2, s + 0.05))}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setScale(0.95)}
              className="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors border-l border-stone-800 ml-0.5 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Inline Score Editing Toggle (Auto-Save on blur) */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer print:hidden ${
              isEditMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
            title="Toggle inline score editing directly on the report card table"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEditMode ? 'text-indigo-200' : 'text-amber-400'}`} />
            <span>{isEditMode ? 'Edit Mode ON' : 'Edit Marks'}</span>
          </button>

          {/* Live Data Editor Drawer Toggle */}
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer print:hidden ${
              isEditorOpen
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEditorOpen ? 'Close Drawer' : 'Full Overrides'}</span>
            {isEditorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Save & Submit for Director Sign-Off */}
          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border border-emerald-600 print:hidden"
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

          {/* 1-Click Print Button */}
          <button
            onClick={() => handlePrint()}
            className="inline-flex items-center gap-2 bg-[#0f2e60] hover:bg-[#1a3e7a] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition-all cursor-pointer border border-blue-800 print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </header>

      {/* Real-time Inline Auto-save feedback pill */}
      {autoSaveStatus && (
        <div className="w-full max-w-[210mm] mb-3 px-4 py-2 bg-indigo-950/80 border border-indigo-700/70 text-indigo-200 text-xs font-bold rounded-xl flex items-center justify-between animate-fadeIn print:hidden shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{autoSaveStatus}</span>
          </div>
          <button
            onClick={() => setAutoSaveStatus(null)}
            className="text-stone-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Governance & Save Feedback Banner */}
      {saveStatus && (
        <div
          className={`w-full max-w-[210mm] mb-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border no-print ${
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

      {/* Collapsible Marks & Score Tweaker Drawer */}
      {isEditorOpen && (
        <section className="w-full max-w-[210mm] mb-5 bg-stone-950 rounded-2xl shadow-2xl border border-stone-800 p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200 no-print text-stone-100">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                In-Place Marks & Grade Tweaker (Maker-Checker Enabled)
              </h2>
              <p className="text-xs text-stone-400">
                Directly adjust marks or grades below. All updates calculate percentages automatically and queue for Director Sign-off.
              </p>
            </div>

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes to Database</span>
            </button>
          </div>

          {/* Academic Subjects Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-bold font-mono">
              <span>SUBJECT</span>
              <div className="grid grid-cols-4 gap-2 text-center w-72">
                <span>UT1 (30)</span>
                <span>HALF YR (70)</span>
                <span>UT2 (30)</span>
                <span>ANNUAL (70)</span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-800/60">
              {(studentData.level === "junior" ? JUNIOR_SUBJECTS : UPPER_PRIMARY_SUBJECTS).map((subj) => {
                const mark = studentData.subjectMarks?.[subj] || {};
                return (
                  <div key={subj} className="flex items-center justify-between pt-1.5 text-xs">
                    <span className="font-bold text-stone-200 uppercase truncate max-w-[180px]">
                      {subj}
                    </span>
                    <div className="grid grid-cols-4 gap-2 w-72">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="—"
                        value={mark.ut1 ?? ""}
                        onChange={(e) => handleMarkChange(subj, "ut1", e.target.value)}
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="70"
                        placeholder="—"
                        value={mark.halfYearly ?? ""}
                        onChange={(e) => handleMarkChange(subj, "halfYearly", e.target.value)}
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="—"
                        value={mark.ut2 ?? ""}
                        onChange={(e) => handleMarkChange(subj, "ut2", e.target.value)}
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="70"
                        placeholder="—"
                        value={mark.annual ?? ""}
                        onChange={(e) => handleMarkChange(subj, "annual", e.target.value)}
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-amber-300 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Co-Scholastic Grades & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-800 pt-3">
            {/* Grades */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wide">
                Co-Scholastic Grades (A+, A, B, C)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(Array.isArray(CO_SCHOLASTIC_ACTIVITIES) ? CO_SCHOLASTIC_ACTIVITIES : [...(CO_SCHOLASTIC_ACTIVITIES as any).left, ...(CO_SCHOLASTIC_ACTIVITIES as any).right]).map((act) => {
                  const g = studentData.grades?.[act] || {};
                  return (
                    <div key={act} className="p-2 bg-stone-900 rounded-xl border border-stone-800">
                      <span className="block text-[10px] font-bold text-stone-300 truncate">{act}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <select
                          value={g.halfYearly || 'A+'}
                          onChange={(e) => handleGradeChange(act, 'halfYearly', e.target.value)}
                          className="w-full text-[10.5px] font-bold p-1 bg-stone-950 border rounded-lg border-stone-700 text-stone-200"
                        >
                          <option value="A+">HY: A+</option>
                          <option value="A">HY: A</option>
                          <option value="B">HY: B</option>
                          <option value="C">HY: C</option>
                        </select>
                        <select
                          value={g.annual || 'A+'}
                          onChange={(e) => handleGradeChange(act, 'annual', e.target.value)}
                          className="w-full text-[10.5px] font-bold p-1 bg-stone-950 border rounded-lg border-stone-700 text-stone-200"
                        >
                          <option value="A+">Ann: A+</option>
                          <option value="A">Ann: A</option>
                          <option value="B">Ann: B</option>
                          <option value="C">Ann: C</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Remarks & Promotion */}
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wide">
                Remarks & Promotion Info
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Teacher's Remark</label>
                  <input
                    type="text"
                    value={studentData.teacherRemark || ""}
                    onChange={(e) => {
                      setHasUnsavedChanges(true);
                      setStudentData((p) => ({ ...p, teacherRemark: e.target.value }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Rank in Class</label>
                    <input
                      type="text"
                      value={studentData.rankInClass || ""}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setStudentData((p) => ({ ...p, rankInClass: e.target.value }));
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Promoted to Class</label>
                    <input
                      type="text"
                      value={studentData.passedAndPromotedToClass || ""}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setStudentData((p) => ({ ...p, passedAndPromotedToClass: e.target.value }));
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Attendance HY</label>
                    <input
                      type="text"
                      value={studentData.attendanceHalfYearly || ""}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setStudentData((p) => ({ ...p, attendanceHalfYearly: e.target.value }));
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Attendance Annual</label>
                    <input
                      type="text"
                      value={studentData.attendanceAnnual || ""}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        setStudentData((p) => ({ ...p, attendanceAnnual: e.target.value }));
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Printable Sheet Presentation Container */}
      <main className="w-full flex justify-center overflow-x-auto pb-12">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="shadow-2xl rounded-sm transition-transform"
        >
          <div ref={printRef}>
            <MidLevelsReportCard
              data={studentData}
              isEditable={isEditMode}
              onMarkChange={handleMarkChange}
              onMarkBlur={handleMarkBlur}
              onGradeChange={handleGradeChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
