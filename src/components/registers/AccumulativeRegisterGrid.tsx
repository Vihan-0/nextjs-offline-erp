"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  saveAccumulativeMarksAction,
  SaveAccumulativeMarksPayload,
  StudentAccumulativeEntry,
} from "@/actions/saveAccumulativeMarks";
import { resolveClassIndex } from "@/lib/classHierarchy";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import { PrintableMarksLedger } from "./PrintableMarksLedger";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Info,
  Calendar,
  GraduationCap,
  Activity,
  ArrowUpDown,
  BookOpen,
  Home,
  Users,
  Sliders,
} from "lucide-react";

export type RawStudentData = {
  id: string;
  srNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  distanceFromSchool: number | null;
  medicalConditions: string | null;
  fatherName: string;
  fatherQualification: string | null;
  motherName: string;
  motherQualification: string | null;
  sessions: {
    id: string;
    sessionYear: string;
    className: string;
    section: string | null;
    rollNumber: string | null;
    totalMeetingsPresent: number | null;
    totalMeetings: number | null;
    halfYearlyAttendance: number | null;
    annualAttendance: number | null;
    annualTotalDays: number | null;
    resultStatus: string | null;
    marks: {
      id: string;
      subjectName: string;
      examType: string;
      oralMarksObtained: number | null;
      writtenMarksObtained: number | null;
      totalMarksObtained: number | null;
      grade: string | null;
    }[];
    softSkills: {
      id: string;
      skillName: string;
      term: string;
      grade: string;
      remarks: string | null;
    }[];
  }[];
};

interface AccumulativeRegisterGridProps {
  initialStudents: RawStudentData[];
  defaultClass?: string;
  defaultSessionYear?: string;
}

// Available classes & categories
export const CLASS_OPTIONS = [
  { label: "Nursery - PP3", format: "A" },
  { label: "LKG - PP2", format: "A" },
  { label: "UKG - PP1", format: "A" },
  { label: "Class 1", format: "A" },
  { label: "Class 2", format: "A" },
  { label: "Class 3", format: "B" },
  { label: "Class 4", format: "B" },
  { label: "Class 5", format: "B" },
  { label: "Class 6", format: "C" },
  { label: "Class 7", format: "C" },
  { label: "Class 8", format: "C" },
  { label: "Class 9", format: "C" },
];

export const TERMS_FORMAT_A = ["Term I", "Term II", "Term III", "Term IV", "All Terms"];
export const TERMS_FORMAT_BC = [
  "Unit Test 1",
  "Half Yearly",
  "Unit Test 2",
  "Annual",
  "All Terms (Consolidated)",
];

export interface MaxMarksConfig {
  ut1Max: number;
  halfYearlyMax: number;
  ut2Max: number;
  annualMax: number;
  oralMax: number;
  writtenMax: number;
}

export function calculateGradeFromPercentage(pct: number): string {
  if (isNaN(pct)) return "—";
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  if (pct >= 21) return "E1";
  return "E2";
}

export function AccumulativeRegisterGrid({
  initialStudents,
  defaultClass = "Class 3",
  defaultSessionYear = "2026-2027",
}: AccumulativeRegisterGridProps) {
  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [selectedSessionYear, setSelectedSessionYear] = useState(defaultSessionYear);
  const [searchQuery, setSearchQuery] = useState("");

  // Determine active register format
  const activeFormat = useMemo(() => {
    const found = CLASS_OPTIONS.find((c) => c.label.toUpperCase() === selectedClass.toUpperCase());
    return found?.format || "B";
  }, [selectedClass]);

  // Selected Term state based on format
  const [selectedTerm, setSelectedTerm] = useState<string>(
    activeFormat === "A" ? "Term I" : "Unit Test 1"
  );

  // Sync default term when format changes
  useEffect(() => {
    if (activeFormat === "A") {
      if (!TERMS_FORMAT_A.includes(selectedTerm)) setSelectedTerm("Term I");
    } else {
      if (!TERMS_FORMAT_BC.includes(selectedTerm)) setSelectedTerm("Unit Test 1");
    }
  }, [activeFormat]);

  // Extract height and weight from medicalConditions tag or fallback
  const parsePhysique = (medNotes: string | null) => {
    if (!medNotes) return { height: "", weight: "" };
    const match = medNotes.match(/\[Physique:\s*Ht\s*([^,]+)\s*cm,\s*Wt\s*([^\]]+)\s*kg\]/i);
    if (match) {
      return {
        height: match[1].trim() === "-" ? "" : match[1].trim(),
        weight: match[2].trim() === "-" ? "" : match[2].trim(),
      };
    }
    return { height: "", weight: "" };
  };

  // State holding grid data for students
  // Key: student srNumber -> state object
  const [gridData, setGridData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [maxMarksConfig, setMaxMarksConfig] = useState<MaxMarksConfig>({
    ut1Max: 25,
    halfYearlyMax: 80,
    ut2Max: 25,
    annualMax: 80,
    oralMax: 20,
    writtenMax: 80,
  });
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Dedicated Print Ledger Ref
  const printLedgerRef = useRef<HTMLDivElement>(null);
  const handlePrintLedger = useReactToPrint({
    contentRef: printLedgerRef,
    documentTitle: `Marks_Register_${selectedClass.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedSessionYear}`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 6mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: #ffffff !important;
        }
      }
    `,
  });

  // Initialize and populate grid data from initial students
  useEffect(() => {
    const newGrid: Record<string, any> = {};

    initialStudents.forEach((student) => {
      const activeSession =
        student.sessions.find(
          (s) =>
            s.sessionYear === selectedSessionYear &&
            resolveClassIndex(s.className) === resolveClassIndex(selectedClass)
        ) || student.sessions[0];

      const { height, weight } = parsePhysique(student.medicalConditions);

      // Extract marks keyed by subjectName_examType
      const marksMap: Record<
        string,
        { oral?: number | string; written?: number | string; total?: number | string; grade?: string }
      > = {};

      if (activeSession?.marks) {
        activeSession.marks.forEach((m) => {
          const key = `${m.subjectName}__${m.examType}`;
          marksMap[key] = {
            oral: m.oralMarksObtained !== null && m.oralMarksObtained !== undefined ? m.oralMarksObtained : "",
            written: m.writtenMarksObtained !== null && m.writtenMarksObtained !== undefined ? m.writtenMarksObtained : "",
            total: m.totalMarksObtained !== null && m.totalMarksObtained !== undefined ? m.totalMarksObtained : "",
            grade: m.grade || "",
          };
        });
      }

      // Extract soft skills
      const softSkillsMap: Record<string, string> = {};
      if (activeSession?.softSkills) {
        activeSession.softSkills.forEach((sk) => {
          softSkillsMap[`${sk.skillName}__${sk.term}`] = sk.grade;
        });
      }

      newGrid[student.srNumber] = {
        srNumber: student.srNumber,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        dateOfBirth: student.dateOfBirth,
        rollNumber: activeSession?.rollNumber || "",
        bloodGroup: student.bloodGroup || "",
        height: height || "",
        weight: weight || "",
        distanceFromSchool:
          student.distanceFromSchool !== null && student.distanceFromSchool !== undefined
            ? student.distanceFromSchool
            : "",
        fatherName: student.fatherName || "",
        fatherQualification: student.fatherQualification || "",
        motherName: student.motherName || "",
        motherQualification: student.motherQualification || "",
        attendancePresent:
          activeSession?.totalMeetingsPresent !== null && activeSession?.totalMeetingsPresent !== undefined
            ? activeSession.totalMeetingsPresent
            : activeSession?.annualAttendance || "",
        attendanceTotal:
          activeSession?.totalMeetings !== null && activeSession?.totalMeetings !== undefined
            ? activeSession.totalMeetings
            : activeSession?.annualTotalDays || 200,
        resultStatus: activeSession?.resultStatus || "Promoted",
        marks: marksMap,
        softSkills: softSkillsMap,
      };
    });

    setGridData(newGrid);
    setHasChanges(false);
  }, [initialStudents, selectedClass, selectedSessionYear]);

  // Filter students: only show those who have a session record for the selected class AND session year
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((student) => {
      // Must have a session entry matching BOTH the selected class AND session year
      const hasMatchingSession = student.sessions.some(
        (s) =>
          resolveClassIndex(s.className) === resolveClassIndex(selectedClass) &&
          s.sessionYear === selectedSessionYear
      );

      if (!hasMatchingSession) return false;

      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        fullName.includes(searchQuery.toLowerCase()) ||
        student.srNumber.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [initialStudents, selectedClass, selectedSessionYear, searchQuery]);

  // Update cell field helper
  const handleCellChange = (srNumber: string, fieldPath: string, value: any) => {
    setGridData((prev) => {
      const studentData = { ...prev[srNumber] };
      if (!studentData) return prev;

      if (fieldPath.includes(".")) {
        const [parent, child, sub] = fieldPath.split(".");
        if (sub) {
          studentData[parent] = {
            ...studentData[parent],
            [child]: {
              ...(studentData[parent]?.[child] || {}),
              [sub]: value,
            },
          };
        } else {
          studentData[parent] = {
            ...studentData[parent],
            [child]: value,
          };
        }
      } else {
        studentData[fieldPath] = value;
      }

      return {
        ...prev,
        [srNumber]: studentData,
      };
    });
    setHasChanges(true);
  };

  // Bulk Save Handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: "" });

    try {
      const studentEntries: StudentAccumulativeEntry[] = Object.values(gridData).map((st: any) => {
        // Flatten marks map back to array
        const markItems: {
          subjectName: string;
          examType: string;
          oralMarksObtained?: number | null;
          oralMaxMarks?: number | null;
          writtenMarksObtained?: number | null;
          writtenMaxMarks?: number | null;
          totalMarksObtained?: number | null;
          totalMaxMarks?: number | null;
          grade?: string | null;
        }[] = [];

        if (st.marks) {
          Object.entries(st.marks).forEach(([key, val]: [string, any]) => {
            const [subjectName, examType] = key.split("__");
            if (subjectName && examType) {
              const oral = val.oral !== "" && val.oral !== undefined ? parseFloat(val.oral) : null;
              const written = val.written !== "" && val.written !== undefined ? parseFloat(val.written) : null;
              const total =
                val.total !== "" && val.total !== undefined
                  ? parseFloat(val.total)
                  : oral !== null || written !== null
                  ? (oral || 0) + (written || 0)
                  : null;

              const isUT = examType.includes("Unit") || examType.includes("UT");
              const isHY = examType.includes("Half") || examType.includes("HY");
              const maxForExam = isUT
                ? examType.includes("2")
                  ? maxMarksConfig.ut2Max
                  : maxMarksConfig.ut1Max
                : isHY
                ? maxMarksConfig.halfYearlyMax
                : maxMarksConfig.annualMax;

              markItems.push({
                subjectName,
                examType,
                oralMarksObtained: isNaN(oral as number) ? null : oral,
                oralMaxMarks: oral !== null ? maxMarksConfig.oralMax : null,
                writtenMarksObtained: isNaN(written as number) ? null : written,
                writtenMaxMarks: written !== null ? maxMarksConfig.writtenMax : null,
                totalMarksObtained: isNaN(total as number) ? null : total,
                totalMaxMarks: maxForExam,
                grade: val.grade || null,
              });
            }
          });
        }

        // Flatten soft skills map
        const skillItems: { skillName: string; term: string; grade: string; remarks?: string | null }[] = [];
        if (st.softSkills) {
          Object.entries(st.softSkills).forEach(([key, grade]: [string, any]) => {
            const [skillName, term] = key.split("__");
            if (skillName && term && grade) {
              skillItems.push({
                skillName,
                term,
                grade: String(grade),
              });
            }
          });
        }

        return {
          srNumber: st.srNumber,
          rollNumber: st.rollNumber || undefined,
          bloodGroup: st.bloodGroup || undefined,
          height: st.height || undefined,
          weight: st.weight || undefined,
          distanceFromSchool:
            st.distanceFromSchool !== "" && st.distanceFromSchool !== undefined
              ? parseFloat(st.distanceFromSchool)
              : null,
          fatherQualification: st.fatherQualification || undefined,
          motherQualification: st.motherQualification || undefined,
          resultStatus: st.resultStatus || undefined,
          attendancePresent:
            st.attendancePresent !== "" && st.attendancePresent !== undefined
              ? parseInt(st.attendancePresent, 10)
              : null,
          attendanceTotal:
            st.attendanceTotal !== "" && st.attendanceTotal !== undefined
              ? parseInt(st.attendanceTotal, 10)
              : null,
          marks: markItems,
          softSkills: skillItems,
        };
      });

      const payload: SaveAccumulativeMarksPayload = {
        sessionYear: selectedSessionYear,
        className: selectedClass,
        students: studentEntries,
      };

      const result = await saveAccumulativeMarksAction(payload);

      if (result.success) {
        setSaveStatus({
          type: "success",
          message: result.message || "Accumulative Marks Register saved successfully!",
        });
        setHasChanges(false);
      } else {
        setSaveStatus({
          type: "error",
          message: result.error || "Failed to save register.",
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: "error",
        message: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gridData, selectedClass, selectedSessionYear]);

  // Export to CSV helper
  const exportToCSV = () => {
    if (filteredStudents.length === 0) return;

    let headers: string[] = ["S.R. No", "Roll No", "Student Name", "Class", "Term"];
    if (activeFormat === "A") {
      headers.push(
        "Eng Lit Oral",
        "Eng Lit Wri",
        "Eng Lang Oral",
        "Eng Lang Wri",
        "Eng Dict",
        "Eng Read",
        "Hin Lit Oral",
        "Hin Lit Wri",
        "Hin Lang Oral",
        "Hin Lang Wri",
        "Maths Logic",
        "Maths Mental",
        "Maths Oral",
        "EVS Wri",
        "EVS Oral",
        "GK Wri",
        "GK Oral",
        "Computer",
        "Art/Craft",
        "PT",
        "Homework Quality",
        "Single Attendance",
        "Blood Group",
        "Height (cm)",
        "Weight (kg)",
        "Distance (km)",
        "Father Qual",
        "Mother Qual",
        "Result"
      );
    } else if (activeFormat === "B") {
      headers.push(
        "English",
        "Hindi",
        "Maths",
        "Science",
        "History",
        "Geography",
        "Computer",
        "G.K",
        "Sanskrit",
        "Art",
        "P.T.",
        "Total",
        "Percentage",
        "Single Attendance",
        "Result",
        "Blood Group",
        "Height (cm)",
        "Weight (kg)",
        "Distance (km)",
        "Father Qual",
        "Mother Qual"
      );
    } else {
      headers.push(
        "English",
        "Hindi",
        "Maths-I",
        "Maths-II",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Geography",
        "Computer",
        "G.K",
        "Sanskrit",
        "Art",
        "P.T.",
        "Total",
        "Percentage",
        "Single Attendance",
        "Result",
        "Blood Group",
        "Height (cm)",
        "Weight (kg)",
        "Distance (km)",
        "Father Qual",
        "Mother Qual"
      );
    }

    const rows = filteredStudents.map((st) => {
      const data = gridData[st.srNumber] || {};
      const row: (string | number)[] = [
        st.srNumber,
        data.rollNumber || "",
        data.fullName || `${st.firstName} ${st.lastName}`,
        selectedClass,
        selectedTerm,
      ];
      // Push general info
      return row.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Register_${selectedClass.replace(/\s+/g, "_")}_${selectedTerm.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 text-stone-900 font-sans pb-24">
      {/* Top Header & Navigation Banner */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2e60] text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-stone-900 tracking-tight uppercase">
                  Accumulative Marks Register
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0f2e60] border border-blue-200">
                  Format {activeFormat} • {activeFormat === "A" ? "Nursery - Class II" : activeFormat === "B" ? "Classes III - V" : "Classes VI - VIII / IX"}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                High-density Excel-like Ledger for Mark Breakups, Physical Metrics & Parent Qualifications
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors shadow-xs"
              title="Return to Home Dashboard"
            >
              <Home className="w-3.5 h-3.5 text-stone-700" />
              <span>Home</span>
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors shadow-xs"
              title="Open Student Directory"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory</span>
            </Link>
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Export Register to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintLedger()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0f2e60] hover:bg-[#153a77] rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Print Official Landscape Marks Register"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 shadow-xs">
              <GraduationCap className="w-4 h-4 text-[#0f2e60]" />
              <span className="font-bold text-stone-600">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer pr-2"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 shadow-xs">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-stone-600">Term / Exam:</span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer pr-2"
              >
                {(activeFormat === "A" ? TERMS_FORMAT_A : TERMS_FORMAT_BC).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Year */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-300 shadow-xs">
              <span className="font-bold text-stone-600">Session:</span>
              <select
                value={selectedSessionYear}
                onChange={(e) => setSelectedSessionYear(e.target.value)}
                className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
                <option value="2021-2022">2021-2022</option>
                <option value="2020-2021">2020-2021</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search student or S.R. No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
        </div>
      </header>

      {/* Examination Out-Of / Maximum Marks (Max Marks) Configuration Bar */}
      <div className="mx-4 sm:mx-6 mt-3 bg-white rounded-2xl border border-stone-300 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0f2e60]" />
              <span>Examination Out-Of / Maximum Marks (Max Marks) Configuration</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Set the exact Maximum Marks for each exam component. Totals, percentages, and CBSE grades calculate dynamically against these exact limits.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Active: Format {activeFormat} • {selectedTerm}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">UT 1 Max</label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxMarksConfig.ut1Max}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, ut1Max: parseInt(e.target.value) || 25 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">Half Yearly Max</label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxMarksConfig.halfYearlyMax}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, halfYearlyMax: parseInt(e.target.value) || 80 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">UT 2 Max</label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxMarksConfig.ut2Max}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, ut2Max: parseInt(e.target.value) || 25 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">Annual Exam Max</label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxMarksConfig.annualMax}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, annualMax: parseInt(e.target.value) || 80 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">Oral Max</label>
            <input
              type="number"
              min="0"
              max="50"
              value={maxMarksConfig.oralMax}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, oralMax: parseInt(e.target.value) || 20 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">Written Max</label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxMarksConfig.writtenMax}
              onChange={(e) => setMaxMarksConfig((p) => ({ ...p, writtenMax: parseInt(e.target.value) || 80 }))}
              className="w-full text-center font-mono font-bold py-1 px-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-900 focus:bg-white focus:ring-1 focus:ring-[#0f2e60]"
            />
          </div>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus.type && (
        <div
          className={`mx-4 sm:mx-6 mt-3 p-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold shadow-xs ${
            saveStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Excel-like Data Grid Container */}
      <main className="flex-1 px-4 sm:px-6 py-4">
        <div className="bg-white rounded-xl border border-stone-300 shadow-sm overflow-hidden flex flex-col">
          {/* Top Instruction strip */}
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center justify-between text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong>Excel Grid Mode:</strong> Tab / Shift+Tab to traverse cells. Real-time auto-calculation of totals & percentages active.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Students Enrolled: <strong>{filteredStudents.length}</strong>
              </span>
              {hasChanges && (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Unsaved Changes
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Spreadsheet Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)]">
            {activeFormat === "A" && (
              <FormatAGridTable
                students={filteredStudents}
                gridData={gridData}
                selectedTerm={selectedTerm}
                maxMarksConfig={maxMarksConfig}
                onCellChange={handleCellChange}
              />
            )}
            {activeFormat === "B" && (
              <FormatBGridTable
                students={filteredStudents}
                gridData={gridData}
                selectedTerm={selectedTerm}
                maxMarksConfig={maxMarksConfig}
                onCellChange={handleCellChange}
              />
            )}
            {activeFormat === "C" && (
              <FormatCGridTable
                students={filteredStudents}
                gridData={gridData}
                selectedTerm={selectedTerm}
                maxMarksConfig={maxMarksConfig}
                onCellChange={handleCellChange}
              />
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Save Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-300 shadow-lg px-6 py-3 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-stone-600">
          <span className="hidden sm:inline">
            Class: <strong className="text-stone-900">{selectedClass}</strong> • Term:{" "}
            <strong className="text-stone-900">{selectedTerm}</strong> • Year:{" "}
            <strong className="text-stone-900">{selectedSessionYear}</strong>
          </span>
          <span className="text-stone-400">|</span>
          <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-stone-500">
            Ctrl + S to Quick Save
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs font-bold text-amber-600 animate-pulse">
              ● You have unsaved modifications
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-[#0f2e60] hover:bg-[#1a3e7a] text-white px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Accumulative Register</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Hidden Printable Landscape Ledger Area */}
      <div className="hidden">
        <div ref={printLedgerRef}>
          <PrintableMarksLedger
            selectedClass={selectedClass}
            selectedSessionYear={selectedSessionYear}
            selectedTerm={selectedTerm}
            activeFormat={activeFormat}
            students={filteredStudents}
            gridData={gridData}
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// FORMAT A GRID (Nursery to Class II - Matching Handwritten Ref 2)
// -------------------------------------------------------------
function FormatAGridTable({
  students,
  gridData,
  selectedTerm,
  maxMarksConfig,
  onCellChange,
}: {
  students: RawStudentData[];
  gridData: Record<string, any>;
  selectedTerm: string;
  maxMarksConfig: MaxMarksConfig;
  onCellChange: (srNumber: string, path: string, val: any) => void;
}) {
  const termKey = selectedTerm === "All Terms" ? "Term I" : selectedTerm;

  return (
    <table className="w-full text-left text-xs border-collapse font-sans min-w-[2400px]">
      <thead className="sticky top-0 bg-stone-100 z-20 shadow-[0_1px_0_0_#d6d3d1]">
        {/* Tier 1 Header */}
        <tr className="border-b border-stone-300 text-stone-700 font-bold uppercase text-[11px] text-center">
          <th className="sticky left-0 bg-stone-100 z-30 px-3 py-2 border-r border-stone-300 min-w-[70px]">
            S.R. No.
          </th>
          <th className="sticky left-[70px] bg-stone-100 z-30 px-2 py-2 border-r border-stone-300 min-w-[60px]">
            Roll No
          </th>
          <th className="sticky left-[130px] bg-stone-100 z-30 px-4 py-2 border-r-2 border-stone-400 min-w-[170px] text-left">
            Student Name
          </th>
          <th colSpan={4} className="px-2 py-2 border-r border-stone-300 bg-blue-50/70 text-blue-950">
            (1) ENGLISH
          </th>
          <th colSpan={4} className="px-2 py-2 border-r border-stone-300 bg-amber-50/70 text-amber-950">
            (2) HINDI
          </th>
          <th colSpan={3} className="px-2 py-2 border-r border-stone-300 bg-emerald-50/70 text-emerald-950">
            (3) MATHS
          </th>
          <th colSpan={2} className="px-2 py-2 border-r border-stone-300 bg-teal-50/70 text-teal-950">
            (4) E.V.S
          </th>
          <th colSpan={2} className="px-2 py-2 border-r border-stone-300 bg-purple-50/70 text-purple-950">
            (5) G.K.
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[90px] bg-stone-50">
            (6) COMPUTER
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px] bg-stone-50">
            (7) ART/CRAFT
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[70px] bg-stone-50">
            (8) P.T.
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[100px] bg-stone-50">
            (9) Quality HW
          </th>
          <th colSpan={2} className="px-2 py-2 border-r border-stone-300 min-w-[130px] bg-stone-50">
            (10) Attendance (Meetings)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[90px] bg-stone-50">
            (11) Result
          </th>
          {/* Physical Stats & Parent Qualifications (Cols 12-17) */}
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px] bg-rose-50/60 text-rose-950">
            (12) Blood Grp
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (13) Ht (cm)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (14) Wt (kg)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[85px] bg-rose-50/60 text-rose-950">
            (15) Dist (km)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (16) Father Qual
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (17) Mother Qual
          </th>
        </tr>

        {/* Tier 2 Sub-Headers */}
        <tr className="border-b border-stone-300 text-stone-600 font-semibold text-[10px] text-center bg-stone-50">
          <th className="sticky left-0 bg-stone-100 z-30 border-r border-stone-300" />
          <th className="sticky left-[70px] bg-stone-100 z-30 border-r border-stone-300" />
          <th className="sticky left-[130px] bg-stone-100 z-30 border-r-2 border-stone-400" />
          {/* English */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Literature</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Language</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Writing/Dict</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[75px]">Read/Recit</th>
          {/* Hindi */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Lit</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Lang</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[75px]">Writ/Dict</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[75px]">Read/Reci</th>
          {/* Maths */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[80px]">Logical Calc</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[80px]">Mental Maths</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[70px]">Oral</th>
          {/* EVS */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[70px]">Written</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[70px]">Oral</th>
          {/* GK */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[70px]">GK Written</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[70px]">GK Oral</th>
          {/* Other Single fields */}
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          {/* Attendance */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[65px]">Present</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[65px]">Total</th>
          {/* Result & Stats */}
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-200" />
          <th className="px-1.5 py-1 border-r border-stone-300" />
        </tr>
      </thead>

      <tbody className="divide-y divide-stone-200">
        {students.length === 0 ? (
          <tr>
            <td colSpan={30} className="px-6 py-12 text-center text-stone-500 font-medium">
              No students found for the selected Class & Filter.
            </td>
          </tr>
        ) : (
          students.map((st, idx) => {
            const row = gridData[st.srNumber] || {};
            const getMark = (subj: string, field: "oral" | "written" | "total" | "grade" = "total") => {
              return row.marks?.[`${subj}__${termKey}`]?.[field] ?? "";
            };
            const setMark = (subj: string, field: "oral" | "written" | "total" | "grade", val: any) => {
              onCellChange(st.srNumber, `marks.${subj}__${termKey}.${field}`, val);
            };

            return (
              <tr key={st.srNumber} className="hover:bg-blue-50/30 transition-colors">
                {/* Sticky S.R. Number */}
                <td className="sticky left-0 bg-white z-10 px-3 py-1.5 font-mono font-bold text-stone-900 border-r border-stone-300 text-center">
                  {st.srNumber}
                </td>
                {/* Roll No */}
                <td className="sticky left-[70px] bg-white z-10 px-1.5 py-1 border-r border-stone-300 text-center">
                  <input
                    type="text"
                    value={row.rollNumber || ""}
                    onChange={(e) => onCellChange(st.srNumber, "rollNumber", e.target.value)}
                    className="w-full text-center text-xs font-mono font-semibold py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-[#0f2e60] rounded"
                    placeholder="—"
                  />
                </td>
                {/* Student Name */}
                <td className="sticky left-[130px] bg-white z-10 px-3 py-1.5 font-semibold text-stone-900 border-r-2 border-stone-400 truncate max-w-[170px]">
                  {row.fullName || `${st.firstName} ${st.lastName}`}
                </td>

                {/* (1) ENGLISH */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("English - Literature")}
                    onChange={(v) => setMark("English - Literature", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("English - Language")}
                    onChange={(v) => setMark("English - Language", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("English - Writing / Dictation")}
                    onChange={(v) => setMark("English - Writing / Dictation", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <GridInput
                    value={getMark("English - Reading / Recitation")}
                    onChange={(v) => setMark("English - Reading / Recitation", "total", v)}
                  />
                </td>

                {/* (2) HINDI */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Hindi - Literature")}
                    onChange={(v) => setMark("Hindi - Literature", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Hindi - Language")}
                    onChange={(v) => setMark("Hindi - Language", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Hindi - Writing / Dictation")}
                    onChange={(v) => setMark("Hindi - Writing / Dictation", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <GridInput
                    value={getMark("Hindi - Reading / Recitation")}
                    onChange={(v) => setMark("Hindi - Reading / Recitation", "total", v)}
                  />
                </td>

                {/* (3) MATHS */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Mathematics - Logic and calculation")}
                    onChange={(v) => setMark("Mathematics - Logic and calculation", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Mathematics - Mental ability")}
                    onChange={(v) => setMark("Mathematics - Mental ability", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <GridInput
                    value={getMark("Mathematics - Oral")}
                    onChange={(v) => setMark("Mathematics - Oral", "total", v)}
                  />
                </td>

                {/* (4) E.V.S */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Environmental Education - Written")}
                    onChange={(v) => setMark("Environmental Education - Written", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <GridInput
                    value={getMark("Environmental Education - Oral")}
                    onChange={(v) => setMark("Environmental Education - Oral", "total", v)}
                  />
                </td>

                {/* (5) G.K. */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("General Awareness - Written")}
                    onChange={(v) => setMark("General Awareness - Written", "total", v)}
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <GridInput
                    value={getMark("General Awareness - Oral")}
                    onChange={(v) => setMark("General Awareness - Oral", "total", v)}
                  />
                </td>

                {/* (6) COMPUTER */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Computer - Theory/Practical")}
                    onChange={(v) => setMark("Computer - Theory/Practical", "total", v)}
                  />
                </td>

                {/* (7) ART / CRAFT */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Art & Craft")}
                    onChange={(v) => setMark("Art & Craft", "total", v)}
                  />
                </td>

                {/* (8) P.T. */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("PT/Game")}
                    onChange={(v) => setMark("PT/Game", "total", v)}
                  />
                </td>

                {/* (9) Quality of Homework */}
                <td className="p-1 border-r border-stone-200">
                  <GridInput
                    value={getMark("Quality of Home Work")}
                    onChange={(v) => setMark("Quality of Home Work", "total", v)}
                    placeholder="A+ / Good"
                  />
                </td>

                {/* (10) Attendance Single Meetings */}
                <td className="p-1 border-r border-stone-200">
                  <input
                    type="number"
                    value={row.attendancePresent ?? ""}
                    onChange={(e) => onCellChange(st.srNumber, "attendancePresent", e.target.value)}
                    className="w-full text-center text-xs font-mono font-bold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="180"
                  />
                </td>
                <td className="p-1 border-r border-stone-300">
                  <input
                    type="number"
                    value={row.attendanceTotal ?? ""}
                    onChange={(e) => onCellChange(st.srNumber, "attendanceTotal", e.target.value)}
                    className="w-full text-center text-xs font-mono text-stone-600 py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="200"
                  />
                </td>

                {/* (11) Result */}
                <td className="p-1 border-r border-stone-300">
                  <input
                    type="text"
                    value={row.resultStatus || ""}
                    onChange={(e) => onCellChange(st.srNumber, "resultStatus", e.target.value)}
                    className="w-full text-center text-xs font-semibold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="Promoted"
                  />
                </td>

                {/* (12) Blood Group */}
                <td className="p-1 border-r border-stone-200">
                  <select
                    value={row.bloodGroup || ""}
                    onChange={(e) => onCellChange(st.srNumber, "bloodGroup", e.target.value)}
                    className="w-full text-center text-xs font-semibold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60] bg-white"
                  >
                    <option value="">—</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </td>

                {/* (13) Height (cm) */}
                <td className="p-1 border-r border-stone-200">
                  <input
                    type="text"
                    value={row.height || ""}
                    onChange={(e) => onCellChange(st.srNumber, "height", e.target.value)}
                    className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="115"
                  />
                </td>

                {/* (14) Weight (kg) */}
                <td className="p-1 border-r border-stone-200">
                  <input
                    type="text"
                    value={row.weight || ""}
                    onChange={(e) => onCellChange(st.srNumber, "weight", e.target.value)}
                    className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="20"
                  />
                </td>

                {/* (15) Distance from School */}
                <td className="p-1 border-r border-stone-200">
                  <input
                    type="number"
                    step="0.1"
                    value={row.distanceFromSchool ?? ""}
                    onChange={(e) => onCellChange(st.srNumber, "distanceFromSchool", e.target.value)}
                    className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="2.5"
                  />
                </td>

                {/* (16) Father's Qualification */}
                <td className="p-1 border-r border-stone-200">
                  <input
                    type="text"
                    value={row.fatherQualification || ""}
                    onChange={(e) => onCellChange(st.srNumber, "fatherQualification", e.target.value)}
                    className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="Graduate / Post-Grad"
                  />
                </td>

                {/* (17) Mother's Qualification */}
                <td className="p-1 border-r border-stone-300">
                  <input
                    type="text"
                    value={row.motherQualification || ""}
                    onChange={(e) => onCellChange(st.srNumber, "motherQualification", e.target.value)}
                    className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                    placeholder="Graduate / Post-Grad"
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// -------------------------------------------------------------
// FORMAT B GRID (Classes III to V - Matching Handwritten Ref 1)
// -------------------------------------------------------------
function FormatBGridTable({
  students,
  gridData,
  selectedTerm,
  maxMarksConfig,
  onCellChange,
}: {
  students: RawStudentData[];
  gridData: Record<string, any>;
  selectedTerm: string;
  maxMarksConfig: MaxMarksConfig;
  onCellChange: (srNumber: string, path: string, val: any) => void;
}) {
  const subjects = [
    { key: "English", num: "1", label: "English" },
    { key: "Hindi", num: "2", label: "Hindi" },
    { key: "Mathematics", num: "3", label: "Maths" },
    { key: "Science", num: "4", label: "Science" },
    { key: "History & Civics", num: "5", label: "History" },
    { key: "Geography", num: "6", label: "Geography" },
    { key: "Computer", num: "7", label: "Computer" },
    { key: "G.Knowledge", num: "8", label: "G.K" },
    { key: "Sanskrit", num: "9", label: "Sanskrit" },
    { key: "Art", num: "10", label: "Art" },
    { key: "P.T.", num: "11", label: "P.T." },
  ];

  const termsToDisplay =
    selectedTerm === "All Terms (Consolidated)"
      ? ["Unit Test 1", "Half Yearly", "Unit Test 2", "Annual"]
      : [selectedTerm];

  return (
    <table className="w-full text-left text-xs border-collapse font-sans min-w-[2200px]">
      <thead className="sticky top-0 bg-stone-100 z-20 shadow-[0_1px_0_0_#d6d3d1]">
        <tr className="border-b border-stone-300 text-stone-700 font-bold uppercase text-[11px] text-center">
          <th className="sticky left-0 bg-stone-100 z-30 px-3 py-2.5 border-r border-stone-300 min-w-[70px]">
            S.R. No.
          </th>
          <th className="sticky left-[70px] bg-stone-100 z-30 px-2 py-2.5 border-r border-stone-300 min-w-[60px]">
            Roll No
          </th>
          <th className="sticky left-[130px] bg-stone-100 z-30 px-4 py-2.5 border-r-2 border-stone-400 min-w-[170px] text-left">
            Student Name
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[100px] bg-blue-50 text-blue-950">
            Terms
          </th>

          {/* Subjects 1 to 11 */}
          {subjects.map((s) => (
            <th key={s.key} className="px-2 py-2.5 border-r border-stone-300 min-w-[85px]">
              ({s.num}) {s.label}
            </th>
          ))}

          {/* Aggregate & Evaluative Columns (12-21) */}
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[90px] bg-amber-50/70 text-amber-950 font-black">
            (12) Total / Max
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[85px] bg-amber-50/70 text-amber-950 font-black">
            (13) % & Grade
          </th>
          <th colSpan={2} className="px-2 py-2.5 border-r border-stone-300 min-w-[120px] bg-stone-50">
            (14) Attendance (Meetings)
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[90px] bg-stone-50">
            (15) Result
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[80px] bg-rose-50/60 text-rose-950">
            (16) Blood Grp
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (17) Ht (cm)
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (18) Wt (kg)
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[85px] bg-rose-50/60 text-rose-950">
            (19) Dist (km)
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (20) Father Qual
          </th>
          <th className="px-2 py-2.5 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (21) Mother Qual
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-stone-300">
        {students.length === 0 ? (
          <tr>
            <td colSpan={28} className="px-6 py-12 text-center text-stone-500 font-medium">
              No students found for the selected Class & Filter.
            </td>
          </tr>
        ) : (
          students.map((st) => {
            const row = gridData[st.srNumber] || {};

            return (
              <React.Fragment key={st.srNumber}>
                {termsToDisplay.map((term, tIdx) => {
                  const isUT = term.includes("Unit") || term.includes("UT");
                  const isHY = term.includes("Half") || term.includes("HY");
                  const currentMax = isUT
                    ? term.includes("2")
                      ? maxMarksConfig.ut2Max
                      : maxMarksConfig.ut1Max
                    : isHY
                    ? maxMarksConfig.halfYearlyMax
                    : maxMarksConfig.annualMax;

                  // Calculate Row Total & Percentage in real-time
                  let total = 0;
                  let counted = 0;
                  subjects.forEach((subj) => {
                    const val = row.marks?.[`${subj.key}__${term}`]?.total;
                    if (val !== undefined && val !== "" && !isNaN(parseFloat(val))) {
                      total += parseFloat(val);
                      counted += 1;
                    }
                  });

                  const totalPossibleMax = counted * currentMax;
                  const percentage = totalPossibleMax > 0 ? ((total / totalPossibleMax) * 100).toFixed(1) : "—";
                  const grade = percentage !== "—" ? calculateGradeFromPercentage(parseFloat(percentage)) : "—";

                  return (
                    <tr
                      key={`${st.srNumber}_${term}`}
                      className={`${
                        tIdx === termsToDisplay.length - 1 ? "border-b-2 border-stone-400" : "border-b border-stone-200"
                      } hover:bg-blue-50/30 transition-colors`}
                    >
                      {/* S.R. No (Rowspan if multiple terms) */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-0 bg-white z-10 px-3 py-2 font-mono font-bold text-stone-900 border-r border-stone-300 text-center align-middle"
                        >
                          {st.srNumber}
                        </td>
                      ) : null}

                      {/* Roll No */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-[70px] bg-white z-10 px-1.5 py-2 border-r border-stone-300 text-center align-middle"
                        >
                          <input
                            type="text"
                            value={row.rollNumber || ""}
                            onChange={(e) => onCellChange(st.srNumber, "rollNumber", e.target.value)}
                            className="w-full text-center text-xs font-mono font-semibold py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-[#0f2e60] rounded"
                            placeholder="—"
                          />
                        </td>
                      ) : null}

                      {/* Student Name */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-[130px] bg-white z-10 px-3 py-2 font-semibold text-stone-900 border-r-2 border-stone-400 truncate max-w-[170px] align-middle"
                        >
                          {row.fullName || `${st.firstName} ${st.lastName}`}
                        </td>
                      ) : null}

                      {/* Term name tag */}
                      <td className="p-1.5 border-r border-stone-300 font-bold text-stone-700 bg-stone-50/80 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-stone-300 font-mono">
                          {term}
                        </span>
                      </td>

                      {/* Subjects 1-11 */}
                      {subjects.map((s) => {
                        const cellVal = row.marks?.[`${s.key}__${term}`]?.total ?? "";
                        return (
                          <td key={s.key} className="p-1 border-r border-stone-200">
                            <GridInput
                              value={cellVal}
                              max={currentMax}
                              onChange={(v) => onCellChange(st.srNumber, `marks.${s.key}__${term}.total`, v)}
                              placeholder="0"
                            />
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="p-1.5 border-r border-stone-200 text-center font-mono font-bold text-stone-900 bg-amber-50/40">
                        {counted > 0 ? (
                          <div className="flex flex-col items-center">
                            <span>{total}</span>
                            <span className="text-[9.5px] text-stone-400 font-normal">/ {totalPossibleMax}</span>
                          </div>
                        ) : "—"}
                      </td>

                      {/* Percentage & Grade */}
                      <td className="p-1.5 border-r border-stone-300 text-center font-mono font-bold text-[#0f2e60] bg-amber-50/40">
                        {percentage !== "—" ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{percentage}%</span>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">{grade}</span>
                          </div>
                        ) : "—"}
                      </td>

                      {/* Attendance (Spans full student block if multi-term) */}
                      {tIdx === 0 ? (
                        <>
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="number"
                              value={row.attendancePresent ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "attendancePresent", e.target.value)}
                              className="w-full text-center text-xs font-mono font-bold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="188"
                            />
                          </td>
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="number"
                              value={row.attendanceTotal ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "attendanceTotal", e.target.value)}
                              className="w-full text-center text-xs font-mono text-stone-500 py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="200"
                            />
                          </td>

                          {/* Result */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="text"
                              value={row.resultStatus || ""}
                              onChange={(e) => onCellChange(st.srNumber, "resultStatus", e.target.value)}
                              className="w-full text-center text-xs font-semibold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="Promoted"
                            />
                          </td>

                          {/* Blood Group */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <select
                              value={row.bloodGroup || ""}
                              onChange={(e) => onCellChange(st.srNumber, "bloodGroup", e.target.value)}
                              className="w-full text-center text-xs font-semibold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60] bg-white"
                            >
                              <option value="">—</option>
                              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                                <option key={bg} value={bg}>
                                  {bg}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Height */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.height || ""}
                              onChange={(e) => onCellChange(st.srNumber, "height", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="128"
                            />
                          </td>

                          {/* Weight */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.weight || ""}
                              onChange={(e) => onCellChange(st.srNumber, "weight", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="26"
                            />
                          </td>

                          {/* Distance */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="number"
                              step="0.1"
                              value={row.distanceFromSchool ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "distanceFromSchool", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="3.0"
                            />
                          </td>

                          {/* Father Qual */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.fatherQualification || ""}
                              onChange={(e) => onCellChange(st.srNumber, "fatherQualification", e.target.value)}
                              className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="B.Com / M.A."
                            />
                          </td>

                          {/* Mother Qual */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="text"
                              value={row.motherQualification || ""}
                              onChange={(e) => onCellChange(st.srNumber, "motherQualification", e.target.value)}
                              className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="B.Sc / B.Ed"
                            />
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// -------------------------------------------------------------
// FORMAT C GRID (Classes VI to VIII & IX - Matching Handwritten Ref 3)
// -------------------------------------------------------------
function FormatCGridTable({
  students,
  gridData,
  selectedTerm,
  maxMarksConfig,
  onCellChange,
}: {
  students: RawStudentData[];
  gridData: Record<string, any>;
  selectedTerm: string;
  maxMarksConfig: MaxMarksConfig;
  onCellChange: (srNumber: string, path: string, val: any) => void;
}) {
  const termsToDisplay =
    selectedTerm === "All Terms (Consolidated)"
      ? ["Unit Test 1", "Half Yearly", "Unit Test 2", "Annual"]
      : [selectedTerm];

  return (
    <table className="w-full text-left text-xs border-collapse font-sans min-w-[2500px]">
      <thead className="sticky top-0 bg-stone-100 z-20 shadow-[0_1px_0_0_#d6d3d1]">
        {/* Tier 1 Super Headers */}
        <tr className="border-b border-stone-300 text-stone-700 font-bold uppercase text-[11px] text-center">
          <th className="sticky left-0 bg-stone-100 z-30 px-3 py-2 border-r border-stone-300 min-w-[70px]">
            S.R. No.
          </th>
          <th className="sticky left-[70px] bg-stone-100 z-30 px-2 py-2 border-r border-stone-300 min-w-[60px]">
            Roll No
          </th>
          <th className="sticky left-[130px] bg-stone-100 z-30 px-4 py-2 border-r-2 border-stone-400 min-w-[170px] text-left">
            Student Name
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[100px] bg-blue-50 text-blue-950">
            Terms
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[85px]">
            (1) English
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[85px]">
            (2) Hindi
          </th>
          <th colSpan={2} className="px-2 py-2 border-r border-stone-300 bg-emerald-50/60 text-emerald-950">
            (3) Maths
          </th>
          <th colSpan={3} className="px-2 py-2 border-r border-stone-300 bg-teal-50/60 text-teal-950">
            (4) Science
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px]">
            (5) Hist
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px]">
            (6) Geog
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px]">
            (7) Com
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px]">
            (8) G.K
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px]">
            (9) Sanskrit
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px]">
            (10) Art
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px]">
            (11) P.T.
          </th>
          {/* Aggregate cols 12-21 */}
          <th className="px-2 py-2 border-r border-stone-300 min-w-[90px] bg-amber-50/70 text-amber-950 font-black">
            (12) Total / Max
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[85px] bg-amber-50/70 text-amber-950 font-black">
            (13) % & Grade
          </th>
          <th colSpan={2} className="px-2 py-2 border-r border-stone-300 min-w-[120px] bg-stone-50">
            (14) Attendance (Single Mtg)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[90px] bg-stone-50">
            (15) Result
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[80px] bg-rose-50/60 text-rose-950">
            (16) Blood Grp
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (17) Ht (cm)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[75px] bg-rose-50/60 text-rose-950">
            (18) Wt (kg)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[85px] bg-rose-50/60 text-rose-950">
            (19) Dist (km)
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (20) Father Qual
          </th>
          <th className="px-2 py-2 border-r border-stone-300 min-w-[120px] bg-indigo-50/60 text-indigo-950">
            (21) Mother Qual
          </th>
        </tr>

        {/* Tier 2 Sub-Headers for Maths (I, II) & Science (Phy, Chem, Bio) */}
        <tr className="border-b border-stone-300 text-stone-600 font-semibold text-[10px] text-center bg-stone-50">
          <th className="sticky left-0 bg-stone-100 z-30 border-r border-stone-300" />
          <th className="sticky left-[70px] bg-stone-100 z-30 border-r border-stone-300" />
          <th className="sticky left-[130px] bg-stone-100 z-30 border-r-2 border-stone-400" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          {/* Maths split */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[70px]">I</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[70px]">II</th>
          {/* Science split */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[70px]">Physics</th>
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[70px]">Chemistry</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[70px]">Biology</th>
          {/* Remaining cols */}
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          {/* Attendance */}
          <th className="px-1.5 py-1 border-r border-stone-200 min-w-[60px]">Present</th>
          <th className="px-1.5 py-1 border-r border-stone-300 min-w-[60px]">Total</th>
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
          <th className="border-r border-stone-300" />
        </tr>
      </thead>

      <tbody className="divide-y divide-stone-300">
        {students.length === 0 ? (
          <tr>
            <td colSpan={30} className="px-6 py-12 text-center text-stone-500 font-medium">
              No students found for the selected Class & Filter.
            </td>
          </tr>
        ) : (
          students.map((st) => {
            const row = gridData[st.srNumber] || {};

            const cSubjects = [
              "English",
              "Hindi",
              "Mathematics- I",
              "Mathematics- II",
              "Physics",
              "Chemistry",
              "Biology",
              "History & Civics",
              "Geography",
              "Computer",
              "G.Knowledge",
              "Sanskrit",
              "Art",
              "P.T.",
            ];

            return (
              <React.Fragment key={st.srNumber}>
                {termsToDisplay.map((term, tIdx) => {
                  const isUT = term.includes("Unit") || term.includes("UT");
                  const isHY = term.includes("Half") || term.includes("HY");
                  const currentMax = isUT
                    ? term.includes("2")
                      ? maxMarksConfig.ut2Max
                      : maxMarksConfig.ut1Max
                    : isHY
                    ? maxMarksConfig.halfYearlyMax
                    : maxMarksConfig.annualMax;

                  const mathsHalf = Math.max(1, Math.round(currentMax / 2));
                  const scienceThird = Math.max(1, Math.round(currentMax / 3));

                  // Real-time calculation
                  let total = 0;
                  let totalPossibleMax = 0;
                  let counted = 0;
                  cSubjects.forEach((subjKey) => {
                    const val = row.marks?.[`${subjKey}__${term}`]?.total;
                    if (val !== undefined && val !== "" && !isNaN(parseFloat(val))) {
                      total += parseFloat(val);
                      counted += 1;
                      if (subjKey.includes("Mathematics")) {
                        totalPossibleMax += mathsHalf;
                      } else if (subjKey === "Physics" || subjKey === "Chemistry" || subjKey === "Biology") {
                        totalPossibleMax += scienceThird;
                      } else {
                        totalPossibleMax += currentMax;
                      }
                    }
                  });

                  const percentage = totalPossibleMax > 0 ? ((total / totalPossibleMax) * 100).toFixed(1) : "—";
                  const grade = percentage !== "—" ? calculateGradeFromPercentage(parseFloat(percentage)) : "—";

                  return (
                    <tr
                      key={`${st.srNumber}_${term}`}
                      className={`${
                        tIdx === termsToDisplay.length - 1 ? "border-b-2 border-stone-400" : "border-b border-stone-200"
                      } hover:bg-blue-50/30 transition-colors`}
                    >
                      {/* S.R. No */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-0 bg-white z-10 px-3 py-2 font-mono font-bold text-stone-900 border-r border-stone-300 text-center align-middle"
                        >
                          {st.srNumber}
                        </td>
                      ) : null}

                      {/* Roll No */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-[70px] bg-white z-10 px-1.5 py-2 border-r border-stone-300 text-center align-middle"
                        >
                          <input
                            type="text"
                            value={row.rollNumber || ""}
                            onChange={(e) => onCellChange(st.srNumber, "rollNumber", e.target.value)}
                            className="w-full text-center text-xs font-mono font-semibold py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-[#0f2e60] rounded"
                            placeholder="—"
                          />
                        </td>
                      ) : null}

                      {/* Student Name */}
                      {tIdx === 0 ? (
                        <td
                          rowSpan={termsToDisplay.length}
                          className="sticky left-[130px] bg-white z-10 px-3 py-2 font-semibold text-stone-900 border-r-2 border-stone-400 truncate max-w-[170px] align-middle"
                        >
                          {row.fullName || `${st.firstName} ${st.lastName}`}
                        </td>
                      ) : null}

                      {/* Term Name */}
                      <td className="p-1.5 border-r border-stone-300 font-bold text-stone-700 bg-stone-50/80 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-stone-300 font-mono">
                          {term}
                        </span>
                      </td>

                      {/* (1) English */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`English__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.English__${term}.total`, v)}
                        />
                      </td>

                      {/* (2) Hindi */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Hindi__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Hindi__${term}.total`, v)}
                        />
                      </td>

                      {/* (3) Maths I & II */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Mathematics- I__${term}`]?.total ?? ""}
                          max={mathsHalf}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Mathematics- I__${term}.total`, v)}
                          placeholder="I"
                        />
                      </td>
                      <td className="p-1 border-r border-stone-300">
                        <GridInput
                          value={row.marks?.[`Mathematics- II__${term}`]?.total ?? ""}
                          max={mathsHalf}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Mathematics- II__${term}.total`, v)}
                          placeholder="II"
                        />
                      </td>

                      {/* (4) Science (Physics, Chemistry, Biology) */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Physics__${term}`]?.total ?? ""}
                          max={scienceThird}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Physics__${term}.total`, v)}
                          placeholder="Phy"
                        />
                      </td>
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Chemistry__${term}`]?.total ?? ""}
                          max={scienceThird}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Chemistry__${term}.total`, v)}
                          placeholder="Chem"
                        />
                      </td>
                      <td className="p-1 border-r border-stone-300">
                        <GridInput
                          value={row.marks?.[`Biology__${term}`]?.total ?? ""}
                          max={scienceThird}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Biology__${term}.total`, v)}
                          placeholder="Bio"
                        />
                      </td>

                      {/* (5) Hist */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`History & Civics__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.History & Civics__${term}.total`, v)}
                        />
                      </td>

                      {/* (6) Geog */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Geography__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Geography__${term}.total`, v)}
                        />
                      </td>

                      {/* (7) Com */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Computer__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Computer__${term}.total`, v)}
                        />
                      </td>

                      {/* (8) GK */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`G.Knowledge__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.G.Knowledge__${term}.total`, v)}
                        />
                      </td>

                      {/* (9) Sanskrit */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Sanskrit__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Sanskrit__${term}.total`, v)}
                        />
                      </td>

                      {/* (10) Art */}
                      <td className="p-1 border-r border-stone-200">
                        <GridInput
                          value={row.marks?.[`Art__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.Art__${term}.total`, v)}
                        />
                      </td>

                      {/* (11) PT */}
                      <td className="p-1 border-r border-stone-300">
                        <GridInput
                          value={row.marks?.[`P.T.__${term}`]?.total ?? ""}
                          max={currentMax}
                          onChange={(v) => onCellChange(st.srNumber, `marks.P.T.__${term}.total`, v)}
                        />
                      </td>

                      {/* (12) Total */}
                      <td className="p-1.5 border-r border-stone-200 text-center font-mono font-bold text-stone-900 bg-amber-50/40">
                        {counted > 0 ? (
                          <div className="flex flex-col items-center">
                            <span>{total}</span>
                            <span className="text-[9.5px] text-stone-400 font-normal">/ {totalPossibleMax}</span>
                          </div>
                        ) : "—"}
                      </td>

                      {/* (13) Percentage */}
                      <td className="p-1.5 border-r border-stone-300 text-center font-mono font-bold text-[#0f2e60] bg-amber-50/40">
                        {percentage !== "—" ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{percentage}%</span>
                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">{grade}</span>
                          </div>
                        ) : "—"}
                      </td>

                      {/* (14) - (21) Evaluative Spanned block */}
                      {tIdx === 0 ? (
                        <>
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="number"
                              value={row.attendancePresent ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "attendancePresent", e.target.value)}
                              className="w-full text-center text-xs font-mono font-bold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="188"
                            />
                          </td>
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="number"
                              value={row.attendanceTotal ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "attendanceTotal", e.target.value)}
                              className="w-full text-center text-xs font-mono text-stone-500 py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="200"
                            />
                          </td>

                          {/* Result */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="text"
                              value={row.resultStatus || ""}
                              onChange={(e) => onCellChange(st.srNumber, "resultStatus", e.target.value)}
                              className="w-full text-center text-xs font-semibold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="Promoted"
                            />
                          </td>

                          {/* Blood Group */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <select
                              value={row.bloodGroup || ""}
                              onChange={(e) => onCellChange(st.srNumber, "bloodGroup", e.target.value)}
                              className="w-full text-xs font-bold py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60] bg-transparent"
                            >
                              <option value="">—</option>
                              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                                <option key={bg} value={bg}>
                                  {bg}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Height */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.height || ""}
                              onChange={(e) => onCellChange(st.srNumber, "height", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="142"
                            />
                          </td>

                          {/* Weight */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.weight || ""}
                              onChange={(e) => onCellChange(st.srNumber, "weight", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="34"
                            />
                          </td>

                          {/* Distance */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="number"
                              step="0.1"
                              value={row.distanceFromSchool ?? ""}
                              onChange={(e) => onCellChange(st.srNumber, "distanceFromSchool", e.target.value)}
                              className="w-full text-center text-xs font-mono py-0.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="4.2"
                            />
                          </td>

                          {/* Father Qual */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-200 align-middle">
                            <input
                              type="text"
                              value={row.fatherQualification || ""}
                              onChange={(e) => onCellChange(st.srNumber, "fatherQualification", e.target.value)}
                              className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="B.Tech / M.B.A."
                            />
                          </td>

                          {/* Mother Qual */}
                          <td rowSpan={termsToDisplay.length} className="p-1 border-r border-stone-300 align-middle">
                            <input
                              type="text"
                              value={row.motherQualification || ""}
                              onChange={(e) => onCellChange(st.srNumber, "motherQualification", e.target.value)}
                              className="w-full text-xs py-0.5 px-1.5 border border-stone-200 rounded focus:ring-1 focus:ring-[#0f2e60]"
                              placeholder="M.Sc / Ph.D"
                            />
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// -------------------------------------------------------------
// Excel-like input helper with clean minimalist borders & font
// -------------------------------------------------------------
function GridInput({
  value,
  onChange,
  max,
  placeholder = "—",
}: {
  value: string | number;
  onChange: (val: string) => void;
  max?: number;
  placeholder?: string;
}) {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  const isOverMax = max !== undefined && !isNaN(num) && num > max;

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-center text-xs font-mono py-1 px-1 border rounded transition-colors focus:outline-none ${
          isOverMax
            ? "border-red-500 bg-red-50 text-red-800 font-bold ring-1 ring-red-400"
            : "border-stone-200 bg-white hover:border-stone-400 focus:border-[#0f2e60] focus:ring-1 focus:ring-[#0f2e60]"
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}
