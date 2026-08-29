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
  Share2,
  Check,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Award,
  UserCheck,
  Home,
  Save,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  ClassIXReportCard,
  type ClassIXReportCardData,
  type TraitRating,
  CLASS_IX_SUBJECTS,
  CLASS_IX_PROJECT_SUBJECTS,
  CLASS_IX_PERSONALITY_TRAITS,
  RATING_OPTIONS,
  getClassIXGrade,
} from "./ClassIXReportCard";
import {
  saveReportCardOverrideAction,
  updateStudentSubjectMark,
  updateStudentSoftSkillMark,
} from "@/actions/saveAccumulativeMarks";

interface ClassIXReportCardClientProps {
  student: ClassIXReportCardData;
}

export function ClassIXReportCardClient({
  student: initialStudent,
}: ClassIXReportCardClientProps) {
  const [studentData, setStudentData] = useState<ClassIXReportCardData>(initialStudent);
  const [scale, setScale] = useState<number>(0.95);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);

  // Auto-open editor if any subject has missing marks
  const hasMissingMarks = React.useMemo(() => {
    return CLASS_IX_SUBJECTS.some((subj) => {
      const m = initialStudent.subjectMarks?.[subj];
      return !m || (m.annual === "" || m.annual === undefined || m.grandTotal === "" || m.grandTotal === undefined);
    });
  }, [initialStudent]);
  const [isEditorOpen, setIsEditorOpen] = useState(hasMissingMarks);

  // Persistence & Maker-Checker State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // A4 Portrait Print Handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Class_IX_Report_Card_${studentData.srNumber}_${studentData.studentName.replace(/\s+/g, "_")}`,
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
        .class-ix-report-card-root {
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
    const text = `Class IX Progress Report: ${studentData.studentName} (S.R. No: ${studentData.srNumber}, Class: ${studentData.classAndSection}, DoB: ${studentData.dateOfBirth})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Academic Marks handlers
  const handleMarkChange = (
    subject: string,
    field: "assessment1" | "halfYearly" | "assessment2" | "annual" | "grandTotal",
    value: string
  ) => {
    setStudentData((prev) => {
      const current = prev.subjectMarks || {};
      const row = current[subject] || {};
      const updatedRow = {
        ...row,
        [field]: value === "" ? "" : isNaN(Number(value)) ? value : Number(value),
      };

      // Auto compute grand total & grade strictly proportional to entered assessments
      if (field !== "grandTotal") {
        const a1 = typeof updatedRow.assessment1 === "number" ? updatedRow.assessment1 : null;
        const hy = typeof updatedRow.halfYearly === "number" ? updatedRow.halfYearly : null;
        const a2 = typeof updatedRow.assessment2 === "number" ? updatedRow.assessment2 : null;
        const ann = typeof updatedRow.annual === "number" ? updatedRow.annual : null;

        let subjectEarned = 0;
        let subjectMax = 0;
        if (a1 !== null) { subjectEarned += a1; subjectMax += 20; }
        if (hy !== null) { subjectEarned += hy; subjectMax += 80; }
        if (a2 !== null) { subjectEarned += a2; subjectMax += 20; }
        if (ann !== null) { subjectEarned += ann; subjectMax += 80; }

        if (subjectMax > 0) {
          const grandTotal = subjectMax === 200 ? Math.round(subjectEarned / 2) : subjectEarned;
          updatedRow.grandTotal = grandTotal;
          const percentage = (subjectEarned / subjectMax) * 100;
          updatedRow.grade = getClassIXGrade(percentage);
        } else {
          updatedRow.grandTotal = "";
          updatedRow.grade = "";
        }
      }

      return {
        ...prev,
        subjectMarks: {
          ...current,
          [subject]: updatedRow,
        },
      };
    });
  };

  // Live onBlur Auto-Save for Inline Class IX Editing
  const handleMarkBlur = async (
    subject: string,
    field: "assessment1" | "halfYearly" | "assessment2" | "annual",
    value: string
  ) => {
    let examType = "Unit Test 1";
    let maxMarks = 20;
    if (field === "halfYearly") {
      examType = "Half Yearly";
      maxMarks = 80;
    } else if (field === "assessment2") {
      examType = "Unit Test 2";
      maxMarks = 20;
    } else if (field === "annual") {
      examType = "Annual";
      maxMarks = 80;
    }

    setAutoSaveStatus(`Syncing ${subject} (${examType})...`);
    try {
      const res = await updateStudentSubjectMark({
        studentSrNumber: studentData.srNumber,
        subjectId: subject,
        examType,
        marksObtained: value === "" ? null : value,
        maxMarks,
        className: studentData.classAndSection.split("-")[0].trim() || "CLASS IX",
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

  // Project Grade Handler with Live Database Auto-Save
  const handleProjectGradeChange = async (
    subject: string,
    term: "halfYearly" | "annual",
    grade: string
  ) => {
    setStudentData((prev) => {
      const current = prev.projectGrades || {};
      const row = current[subject] || {};
      return {
        ...prev,
        projectGrades: {
          ...current,
          [subject]: {
            ...row,
            [term]: grade,
          },
        },
      };
    });

    setAutoSaveStatus(`Syncing Project: ${subject} (${term === "halfYearly" ? "Half Yearly" : "Annual"})...`);
    try {
      const res = await updateStudentSoftSkillMark({
        studentSrNumber: studentData.srNumber,
        skillName: `${subject} (Project)`,
        term: term === "halfYearly" ? "Half Yearly" : "Annual",
        grade,
        className: studentData.classAndSection.split("-")[0].trim() || "CLASS IX",
        sessionYear: studentData.sessionYear || "2026-2027",
      });

      if (res.success) {
        setAutoSaveStatus(`Saved: Project ${subject} grade (${grade}) live synced`);
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    } catch {
      setAutoSaveStatus("Network error syncing project grade");
    }
  };

  // Trait Rating Handler with Live Database Auto-Save
  const handleTraitChange = async (
    trait: string,
    term: "halfYearly" | "annual",
    rating: TraitRating
  ) => {
    setStudentData((prev) => {
      const current = prev.personalityTraits || {};
      const row = current[trait] || { halfYearly: "Always", annual: "Always" };
      return {
        ...prev,
        personalityTraits: {
          ...current,
          [trait]: {
            ...row,
            [term]: rating,
          },
        },
      };
    });

    setAutoSaveStatus(`Syncing Trait: ${trait}...`);
    try {
      const res = await updateStudentSoftSkillMark({
        studentSrNumber: studentData.srNumber,
        skillName: trait,
        term: term === "halfYearly" ? "Half Yearly" : "Annual",
        grade: rating,
        className: studentData.classAndSection.split("-")[0].trim() || "CLASS IX",
        sessionYear: studentData.sessionYear || "2026-2027",
      });

      if (res.success) {
        setAutoSaveStatus(`Saved: ${trait} rating synced`);
        setTimeout(() => setAutoSaveStatus(null), 3000);
      }
    } catch {
      setAutoSaveStatus("Network error syncing trait");
    }
  };

  // Save changes to database and request Director Maker-Checker Sign-off
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Map class IX marks to standard subjectMarks structure
      const mappedMarks: Record<string, any> = {};
      if (studentData.subjectMarks) {
        Object.entries(studentData.subjectMarks).forEach(([subj, m]) => {
          mappedMarks[subj] = {
            ut1: m.assessment1,
            halfYearly: m.halfYearly,
            ut2: m.assessment2,
            annual: m.annual,
            grade: m.grade,
          };
        });
      }

      const result = await saveReportCardOverrideAction({
        srNumber: studentData.srNumber,
        className: studentData.classAndSection.split("-")[0].trim() || "CLASS IX",
        sessionYear: studentData.sessionYear || "2026-2027",
        subjectMarks: mappedMarks,
        grades: studentData.projectGrades,
        attendanceHalfYearly: studentData.attendanceHalfYearly,
        attendanceAnnual: studentData.attendanceAnnual,
        rankInClass: studentData.rankInClass,
        teacherRemark: studentData.teacherRemark,
        passedAndPromotedToClass: studentData.passedAndPromotedToClass,
      });

      if (result.success) {
        setSaveStatus({
          success: true,
          message: result.message || "Class IX report card saved and submitted to Director's clearance queue.",
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
    <div className="min-h-screen bg-stone-900 py-6 px-3 sm:px-6 flex flex-col items-center text-stone-100 pb-16 font-sans">
      {/* Top Floating Control Bar */}
      <header className="w-full max-w-[210mm] mb-5 bg-stone-950/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 sticky top-3 z-30 no-print">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors border border-stone-800"
          >
            <Home className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href={`/students/${encodeURIComponent(studentData.srNumber)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-300 bg-stone-900 hover:bg-stone-800 transition-colors border border-stone-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
          <div className="h-4 w-px bg-stone-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-sm sm:text-base font-extrabold text-stone-100 tracking-tight flex items-center gap-1.5 font-serif">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Class IX Progress Card</span>
            </h1>
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Buttons */}
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
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Live Inline Score Editing Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer print:hidden ${
              isEditMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
            title="Toggle inline score editing directly on the Class IX report card"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEditMode ? 'text-indigo-200' : 'text-indigo-400'}`} />
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

      {/* Collapsible Live Editor Drawer */}
      {isEditorOpen && (
        <section className="w-full max-w-[210mm] mb-5 bg-stone-950 rounded-2xl shadow-2xl border border-stone-800 p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200 no-print text-stone-100">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-black text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Class IX Custom Grading & Evaluation Engine (Maker-Checker Enabled)
              </h2>
              <p className="text-xs text-stone-400">
                Adjust Assessment & Exam marks below. Grand totals and CBSE Grades recalculate live.
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
              <div className="grid grid-cols-5 gap-2 text-center w-80">
                <span>ASS-1 (20)</span>
                <span>HALF YR (80)</span>
                <span>ASS-2 (20)</span>
                <span>ANNUAL (80)</span>
                <span>GRADE</span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-800/60">
              {CLASS_IX_SUBJECTS.map((subj) => {
                const mark = studentData.subjectMarks?.[subj] || {};
                return (
                  <div key={subj} className="flex items-center justify-between pt-1.5 text-xs">
                    <span className="font-bold text-stone-200 uppercase truncate max-w-[150px]">
                      {subj}
                    </span>
                    <div className="grid grid-cols-5 gap-2 w-80 items-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="—"
                        value={mark.assessment1 ?? ""}
                        onChange={(e) => handleMarkChange(subj, "assessment1", e.target.value)}
                        className="w-full px-1.5 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="80"
                        placeholder="—"
                        value={mark.halfYearly ?? ""}
                        onChange={(e) => handleMarkChange(subj, "halfYearly", e.target.value)}
                        className="w-full px-1.5 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="—"
                        value={mark.assessment2 ?? ""}
                        onChange={(e) => handleMarkChange(subj, "assessment2", e.target.value)}
                        className="w-full px-1.5 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        max="80"
                        placeholder="—"
                        value={mark.annual ?? ""}
                        onChange={(e) => handleMarkChange(subj, "annual", e.target.value)}
                        className="w-full px-1.5 py-1 text-center font-bold text-xs bg-stone-900 border border-stone-700 rounded-lg text-indigo-300 focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={mark.grade || "—"}
                        className="w-full px-1 py-1 text-center font-black text-xs bg-stone-950 border border-stone-800 rounded-lg text-emerald-400 cursor-default select-none"
                        title="Grade is calculated automatically from Grand Total"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks, Attendance & Rank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-800 pt-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Teacher's Remark</label>
              <input
                type="text"
                value={studentData.teacherRemark || ""}
                onChange={(e) => setStudentData((p) => ({ ...p, teacherRemark: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Class Rank</label>
                <input
                  type="text"
                  value={studentData.rankInClass || ""}
                  onChange={(e) => setStudentData((p) => ({ ...p, rankInClass: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Attendance HY</label>
                <input
                  type="text"
                  value={studentData.attendanceHalfYearly || ""}
                  onChange={(e) => setStudentData((p) => ({ ...p, attendanceHalfYearly: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-0.5">Attendance Annual</label>
                <input
                  type="text"
                  value={studentData.attendanceAnnual || ""}
                  onChange={(e) => setStudentData((p) => ({ ...p, attendanceAnnual: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Printable Report Card Stage */}
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
            <ClassIXReportCard
              data={studentData}
              isEditable={isEditMode}
              onMarkChange={handleMarkChange}
              onMarkBlur={handleMarkBlur}
              onProjectGradeChange={handleProjectGradeChange}
              onTraitChange={handleTraitChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
