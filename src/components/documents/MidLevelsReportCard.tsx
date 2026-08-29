import React from 'react';
import Image from 'next/image';

export type ReportCardLevel = 'upper-primary' | 'junior';

export interface SubjectMarksRecord {
  ut1?: number | string;
  halfYearly?: number | string;
  ut2?: number | string;
  annual?: number | string;
}

export interface ActivityGradeRecord {
  halfYearly?: string;
  annual?: string;
}

export interface MidLevelsReportCardData {
  level: ReportCardLevel;
  srNumber: string;
  studentName: string;
  dateOfBirth: string;
  fatherName: string;
  motherName: string;
  address: string;
  classAndSection: string;
  contactNo: string;
  branch?: string;
  aadhaarNo?: string;
  sessionYear?: string;

  // Marks by subject name
  subjectMarks?: Record<string, SubjectMarksRecord>;

  // Grades for co-scholastic activities
  grades?: Record<string, ActivityGradeRecord>;

  rankInClass?: string;
  attendanceHalfYearly?: string;
  attendanceAnnual?: string;
  teacherRemark?: string;
  passedAndPromotedToClass?: string;
  schoolReopenOn?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

export interface MidLevelsReportCardProps {
  data: MidLevelsReportCardData;
  className?: string;
  isEditable?: boolean;
  onMarkChange?: (subject: string, field: "ut1" | "halfYearly" | "ut2" | "annual", value: string) => void;
  onMarkBlur?: (subject: string, field: "ut1" | "halfYearly" | "ut2" | "annual", value: string) => void;
  onGradeChange?: (activity: string, field: "halfYearly" | "annual", value: string) => void;
}

// Upper Primary Subject List (11 subjects)
export const UPPER_PRIMARY_SUBJECTS: string[] = [
  'English Lit.',
  'English Lang.',
  'Hindi Lit.',
  'Hindi Lang.',
  'Mathematics',
  'Science',
  'History & Civics',
  'Geography',
  'Computer',
  'G.Knowledge',
  'Sanskrit',
];

// Junior Subject List (14 subjects)
export const JUNIOR_SUBJECTS: string[] = [
  'English Lit.',
  'English Lang.',
  'Hindi Lit.',
  'Hindi Lang.',
  'Mathematics- I',
  'Mathematics- II',
  'Physics',
  'Chemistry',
  'Biology',
  'History & Civics',
  'Geography',
  'Computer',
  'G.Knowledge',
  'Sanskrit',
];

// 6 Co-Scholastic Activities
export const CO_SCHOLASTIC_ACTIVITIES = [
  'READING/RECITATION',
  'DICTATION/WRITING',
  'ART & CRAFT',
  'MORAL SCIENCE',
  'PHYSICAL EDUCATION',
  'ATTENDANCE',
] as const;

// Helper to parse numeric marks
function parseMark(val: number | string | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  return isNaN(num) ? null : num;
}

export function MidLevelsReportCard({
  data,
  className = '',
  isEditable = false,
  onMarkChange,
  onMarkBlur,
  onGradeChange,
}: MidLevelsReportCardProps) {
  const isJunior = data.level === 'junior';
  const subjects = isJunior ? JUNIOR_SUBJECTS : UPPER_PRIMARY_SUBJECTS;
  const sessionYear = data.sessionYear || '2026-2027';
  const branch = data.branch || 'MAIN BRANCH';
  const aadhaarNo = data.aadhaarNo || '—';
  const schoolReopenOn = data.schoolReopenOn || '01.07.2026';
  const passedAndPromotedToClass = data.passedAndPromotedToClass || (isJunior ? 'CLASS IX' : 'CLASS VI');
  const teacherRemark = data.teacherRemark || 'EXCELLENT ACADEMIC PERFORMANCE & CONSISTENT EFFORT';
  const rankInClass = data.rankInClass || '1st ( R )';
  const attendanceHY = data.attendanceHalfYearly || '92 / 96';
  const attendanceAnnual = data.attendanceAnnual || '188 / 198 (95%)';

  const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C', 'D'];

  const renderGradeCell = (activity: string, term: 'halfYearly' | 'annual') => {
    const val = data.grades?.[activity]?.[term] || 'A+';
    if (!isEditable) return val;
    return (
      <select
        value={val}
        onChange={(e) => onGradeChange?.(activity, term, e.target.value)}
        className="w-full text-center py-0 px-0.5 bg-indigo-50/60 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 outline-none text-[9.5px] print:border-none print:bg-transparent print:appearance-none cursor-pointer"
      >
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    );
  };

  // Math Calculations Engine
  let sumUT1 = 0;
  let hasUT1Count = 0;
  let sumHY = 0;
  let hasHYCount = 0;
  let sumAggA = 0;
  let sumUT2 = 0;
  let hasUT2Count = 0;
  let sumAnnual = 0;
  let hasAnnualCount = 0;
  let sumAggB = 0;
  let sumGrandTotal = 0;
  let totalMaxMarksEntered = 0;
  let totalMarksObtainedEntered = 0;

  const subjectRows = subjects.map((subj) => {
    const record = data.subjectMarks?.[subj] || {};
    const ut1 = parseMark(record.ut1);
    const hy = parseMark(record.halfYearly);
    const ut2 = parseMark(record.ut2);
    const ann = parseMark(record.annual);

    let aggA: number | null = null;
    if (ut1 !== null || hy !== null) {
      aggA = (ut1 ?? 0) + (hy ?? 0);
      sumAggA += aggA;
    }

    let aggB: number | null = null;
    if (ut2 !== null || ann !== null) {
      aggB = (ut2 ?? 0) + (ann ?? 0);
      sumAggB += aggB;
    }

    let grandTotal: number | null = null;
    if (aggA !== null || aggB !== null) {
      grandTotal = (aggA ?? 0) + (aggB ?? 0);
      sumGrandTotal += grandTotal;
    }

    if (ut1 !== null) {
      sumUT1 += ut1;
      hasUT1Count++;
      totalMarksObtainedEntered += ut1;
      totalMaxMarksEntered += 30;
    }
    if (hy !== null) {
      sumHY += hy;
      hasHYCount++;
      totalMarksObtainedEntered += hy;
      totalMaxMarksEntered += 70;
    }
    if (ut2 !== null) {
      sumUT2 += ut2;
      hasUT2Count++;
      totalMarksObtainedEntered += ut2;
      totalMaxMarksEntered += 30;
    }
    if (ann !== null) {
      sumAnnual += ann;
      hasAnnualCount++;
      totalMarksObtainedEntered += ann;
      totalMaxMarksEntered += 70;
    }

    return {
      name: subj,
      ut1: ut1 !== null ? ut1 : '',
      halfYearly: hy !== null ? hy : '',
      aggA: aggA !== null ? aggA : '',
      ut2: ut2 !== null ? ut2 : '',
      annual: ann !== null ? ann : '',
      aggB: aggB !== null ? aggB : '',
      grandTotal: grandTotal !== null ? grandTotal : '',
    };
  });

  const overallPercentage =
    totalMaxMarksEntered > 0
      ? ((totalMarksObtainedEntered / totalMaxMarksEntered) * 100).toFixed(1)
      : '—';

  const ut1Percentage = hasUT1Count > 0 ? ((sumUT1 / (hasUT1Count * 30)) * 100).toFixed(1) + '%' : '';
  const hyPercentage = hasHYCount > 0 ? ((sumHY / (hasHYCount * 70)) * 100).toFixed(1) + '%' : '';

  const maxPossibleAggA = (hasUT1Count * 30) + (hasHYCount * 70);
  const aggAPercentage = maxPossibleAggA > 0 ? ((sumAggA / maxPossibleAggA) * 100).toFixed(1) + '%' : '';

  const ut2Percentage = hasUT2Count > 0 ? ((sumUT2 / (hasUT2Count * 30)) * 100).toFixed(1) + '%' : '';
  const annualPercentage = hasAnnualCount > 0 ? ((sumAnnual / (hasAnnualCount * 70)) * 100).toFixed(1) + '%' : '';

  const maxPossibleAggB = (hasUT2Count * 30) + (hasAnnualCount * 70);
  const aggBPercentage = maxPossibleAggB > 0 ? ((sumAggB / maxPossibleAggB) * 100).toFixed(1) + '%' : '';

  const grandTotalPercentage = overallPercentage !== '—' ? `${overallPercentage}%` : '';

  return (
    <div
      className={`mid-levels-report-card-root bg-white text-stone-900 mx-auto select-none print:m-0 print:p-0 ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontFamily: "'Calibri', 'Arial', sans-serif",
      }}
    >
      {/* Outer Golden/Navy Double Frame */}
      <div className="p-3 bg-white h-full flex flex-col justify-between">
        <div className="border-[2.5px] border-[#0f2e60] p-2 flex flex-col justify-between h-full space-y-1 text-[10.5px] leading-tight">
          
          {/* ========================================================= */}
          {/* 1. TOP HEADER SECTION                                     */}
          {/* ========================================================= */}
          <div className="relative pt-0.5 pb-1 px-2 border-b border-[#0f2e60]/30">
            {/* School Logo */}
            <div className="absolute left-2 top-0 bottom-0 flex items-center">
              <div className="w-14 h-14 relative overflow-hidden rounded-full border border-stone-200 shadow-xs bg-white">
                <img
                  src="/thphslogo.jpeg"
                  alt="Town Hall Public High School Logo"
                  className="w-full h-full object-contain block"
                />
              </div>
            </div>

            {/* School Titles & Tagline */}
            <div className="text-center pl-14 pr-2">
              <p className="text-[#c01818] italic font-serif text-[12px] tracking-wide font-semibold">
                “A Tradition In Quality Education”
              </p>
              <h1 className="text-[19px] font-black text-[#c01818] tracking-tight uppercase leading-tight font-sans">
                TOWN HALL PUBLIC HIGH SCHOOL
              </h1>
              <h2 className="text-[12px] font-bold text-[#c01818] tracking-wider uppercase mt-0.5">
                {isJunior ? 'PROGRESS REPORT- JUNIOR' : 'PROGRESS REPORT- UPPER PRIMARY'}
              </h2>
              <p className="text-[11px] font-bold text-[#0f2e60] mt-0.5">
                Session – {sessionYear}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. STUDENT INFORMATION 2-COLUMN TABLE                     */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="w-[18%] py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    STUDENT'S NAME
                  </td>
                  <td className="w-[32%] py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.studentName}
                  </td>
                  <td className="w-[20%] py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    CLASS & SECTION
                  </td>
                  <td className="w-[30%] py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {data.classAndSection}
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    DATE OF BIRTH
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.dateOfBirth}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    S.R NUMBER
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase font-mono">
                    {data.srNumber}
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    FATHER'S NAME
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.fatherName}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    CONTACT NO.
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {data.contactNo}
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    MOTHER'S NAME
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.motherName}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    BRANCH
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {branch}
                  </td>
                </tr>

                {/* Row 5 */}
                <tr>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    ADDRESS
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60] truncate max-w-[200px]" title={data.address}>
                    {data.address}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/70">
                    AADHAAR NO.
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {aadhaarNo}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 3. ACADEMIC MARKS TABLE                                   */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="border-b border-[#0f2e60] bg-stone-50 font-black text-[#c01818] leading-tight">
                  <th className="w-[23%] py-1 px-1.5 text-left border-r border-[#0f2e60] uppercase tracking-wide">
                    SUBJECT
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    UNIT TEST-
                    <br />
                    MM:30
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    HALF YEARLY
                    <br />
                    EXAM MM:70
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    AGGREGATE-
                    <br />
                    A-100
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    UNIT TEST-
                    <br />
                    MM:30
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    EXAM
                    <br />
                    MM:70
                  </th>
                  <th className="w-[11%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    AGGREGATE-
                    <br />
                    B-100
                  </th>
                  <th className="w-[11%] py-1 px-1 uppercase text-[9.5px]">
                    GRAND
                    <br />
                    TOTAL-200
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectRows.map((row) => (
                  <tr
                    key={row.name}
                    className={`border-b border-[#0f2e60] ${isJunior ? 'h-[16.5px]' : 'h-[19px]'}`}
                  >
                    <td className="py-0 px-2 text-left font-bold text-stone-900 border-r border-[#0f2e60] whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="30"
                          value={row.ut1 ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'ut1', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'ut1', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.ut1
                      )}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="70"
                          value={row.halfYearly ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'halfYearly', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'halfYearly', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.halfYearly
                      )}
                    </td>
                    <td className="py-0 px-1 font-bold text-[#0f2e60] bg-blue-50/30 border-r border-[#0f2e60]">
                      {row.aggA}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="30"
                          value={row.ut2 ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'ut2', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'ut2', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.ut2
                      )}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="70"
                          value={row.annual ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'annual', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'annual', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.annual
                      )}
                    </td>
                    <td className="py-0 px-1 font-bold text-[#0f2e60] bg-blue-50/30 border-r border-[#0f2e60]">
                      {row.aggB}
                    </td>
                    <td className="py-0 px-1 font-black text-stone-900 bg-stone-50/50">
                      {row.grandTotal}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="border-b border-[#0f2e60] font-bold text-stone-900 bg-stone-100/70 h-[19px]">
                  <td className="py-0.5 px-2 text-left text-[#0f2e60] font-black border-r border-[#0f2e60] uppercase">
                    Total
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumUT1 > 0 ? sumUT1 : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumHY > 0 ? sumHY : ''}
                  </td>
                  <td className="py-0.5 px-1 font-black text-[#0f2e60] border-r border-[#0f2e60]">
                    {sumAggA > 0 ? sumAggA : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumUT2 > 0 ? sumUT2 : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumAnnual > 0 ? sumAnnual : ''}
                  </td>
                  <td className="py-0.5 px-1 font-black text-[#0f2e60] border-r border-[#0f2e60]">
                    {sumAggB > 0 ? sumAggB : ''}
                  </td>
                  <td className="py-0.5 px-1 font-black text-[#c01818]">
                    {sumGrandTotal > 0 ? sumGrandTotal : ''}
                  </td>
                </tr>

                {/* Percentage Row */}
                <tr className="border-b border-[#0f2e60] font-bold text-stone-800 bg-stone-50/80 h-[19px]">
                  <td className="py-0.5 px-2 text-left text-[#0f2e60] font-black border-r border-[#0f2e60] uppercase">
                    Percentage
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {ut1Percentage}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {hyPercentage}
                  </td>
                  <td className="py-0.5 px-1 font-bold text-[#0f2e60] border-r border-[#0f2e60] text-[9px]">
                    {aggAPercentage}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {ut2Percentage}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {annualPercentage}
                  </td>
                  <td className="py-0.5 px-1 font-bold text-[#0f2e60] border-r border-[#0f2e60] text-[9px]">
                    {aggBPercentage}
                  </td>
                  <td className="py-0.5 px-1 font-black text-[#c01818] text-[9.5px]">
                    {grandTotalPercentage}
                  </td>
                </tr>

                {/* Rank in Class Row */}
                <tr className="border-b border-[#0f2e60] font-bold text-[#0f2e60] bg-white h-[19px]">
                  <td className="py-0.5 px-2 text-left uppercase border-r border-[#0f2e60] font-black">
                    Rank in Class:-
                  </td>
                  <td colSpan={7} className="py-0.5 px-3 text-left font-black text-stone-900">
                    {rankInClass}
                  </td>
                </tr>

                {/* Attendance Row */}
                <tr className="font-bold text-stone-900 bg-white h-[19px]">
                  <td className="py-0.5 px-2 text-left text-[#0f2e60] uppercase border-r border-[#0f2e60] font-black">
                    Attendance :-
                  </td>
                  <td colSpan={3} className="py-0.5 px-2 text-left border-r border-[#0f2e60]">
                    <span className="text-[#0f2e60] font-bold">Half Yearly-</span>{' '}
                    <span className="font-semibold">{attendanceHY}</span>
                  </td>
                  <td colSpan={4} className="py-0.5 px-2 text-left">
                    <span className="text-[#0f2e60] font-bold">Annual-</span>{' '}
                    <span className="font-semibold">{attendanceAnnual}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 4. GRADES SECTION (Co-Scholastic Activities)               */}
          {/* ========================================================= */}
          <div className="space-y-0.5">
            <h3 className="text-center font-black text-[#c01818] tracking-wider text-[11px] uppercase">
              GRADES :-
            </h3>
            <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#0f2e60] bg-stone-50/70 font-black text-[#c01818] text-[9.5px] text-center">
                    <th className="w-[24%] py-0.5 px-1.5 text-left border-r border-[#0f2e60]"></th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">HALF YEARLY</th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">ANNUAL</th>
                    <th className="w-[24%] py-0.5 px-1.5 text-left border-r border-[#0f2e60]"></th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">HALF YEARLY</th>
                    <th className="w-[13%] py-0.5 px-1 uppercase">ANNUAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Reading/Recitation | Moral Science */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      READING/RECITATION
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('READING/RECITATION', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('READING/RECITATION', 'annual')}
                    </td>
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      MORAL SCIENCE
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('MORAL SCIENCE', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderGradeCell('MORAL SCIENCE', 'annual')}
                    </td>
                  </tr>

                  {/* Row 2: Dictation/Writing | Physical Education */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      DICTATION/WRITING
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('DICTATION/WRITING', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('DICTATION/WRITING', 'annual')}
                    </td>
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      PHYSICAL EDUCATION
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('PHYSICAL EDUCATION', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderGradeCell('PHYSICAL EDUCATION', 'annual')}
                    </td>
                  </tr>

                  {/* Row 3: Art & Craft | Attendance */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      ART & CRAFT
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('ART & CRAFT', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('ART & CRAFT', 'annual')}
                    </td>
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      ATTENDANCE
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderGradeCell('ATTENDANCE', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderGradeCell('ATTENDANCE', 'annual')}
                    </td>
                  </tr>

                  {/* Row 4: Teacher's Remark */}
                  <tr className="h-[20px]">
                    <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] whitespace-nowrap bg-stone-50/50">
                      Teacher's Remark
                    </td>
                    <td colSpan={5} className="py-0.5 px-2 text-stone-900 font-bold uppercase text-[9.5px]">
                      {teacherRemark}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. SIGNATURE BLOCKS (4 Columns with Red Titles)           */}
          {/* ========================================================= */}
          <div className="pt-4 pb-1">
            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Class Teacher */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[10px] font-black text-[#c01818] uppercase leading-tight">
                  Class Teacher's
                  <br />
                  Signature
                </span>
              </div>

              {/* Checker */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[10px] font-black text-[#c01818] uppercase leading-tight">
                  Checker's
                  <br />
                  Signature
                </span>
              </div>

              {/* Principal */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[10px] font-black text-[#c01818] uppercase leading-tight">
                  Principal's
                  <br />
                  Signature
                </span>
              </div>

              {/* Parent / Guardian */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[10px] font-black text-[#c01818] uppercase leading-tight">
                  Parent's/Guardian's
                  <br />
                  Signature
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. INDICATION KEY SECTION                                 */}
          {/* ========================================================= */}
          <div className="text-[9.5px] leading-[1.3] text-[#0f2e60] font-medium border-t border-[#0f2e60]/20 pt-1">
            <div className="font-black text-[#0f2e60] mb-0.5 tracking-wide">
              INDICATION :-
            </div>
            <div className="space-y-0.5 pl-1">
              <div className="flex items-start gap-1">
                <span className="font-bold shrink-0">1-</span>
                <div>
                  <span className="font-bold text-[#0f2e60]">Rank :</span> Denotes the Childs Position in class ( R )
                </div>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-bold shrink-0">2-</span>
                <div>
                  <span className="font-bold text-[#0f2e60]">Position :</span> Position is awarded only to students who score 60% or above in every subject.
                </div>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-bold shrink-0">3-</span>
                <div>
                  <span className="font-bold text-[#0f2e60]">Merit :</span> 85% and above (Denoted by*): &nbsp;&nbsp;
                  <span className="font-semibold text-stone-800">I- 75% to 84%</span> &nbsp;&nbsp;
                  <span className="font-semibold text-stone-800">II- 65% to 74%</span> &nbsp;&nbsp;
                  <span className="font-semibold text-stone-800">III- 64% to 60%</span>
                </div>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-bold shrink-0">4-</span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-0.5">
                  <span className="font-bold text-[#0f2e60]">Grades :</span>
                  <span>Best <strong>( A+ )</strong></span>
                  <span>Good <strong>( A )</strong></span>
                  <span>Better <strong>( B )</strong></span>
                  <span>Special attention <strong>( C )</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 7. PROMOTION & ANTI-TAMPER VERIFICATION FOOTER            */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
            <div className="grid grid-cols-2 divide-x divide-[#0f2e60]">
              <div className="py-1 px-2 font-bold flex items-center">
                <span className="text-[#c01818] font-black mr-2">Passed & Promoted to Class</span>
                <span className="text-stone-900 font-bold uppercase">{passedAndPromotedToClass}</span>
              </div>
              <div className="py-1 px-2 font-bold flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-[#c01818] font-black mr-2">School Reopen on</span>
                  <span className="text-stone-900 font-bold">{schoolReopenOn}</span>
                </div>
                {data.traceCode && (
                  <span className="font-mono text-[7px] text-stone-500 font-bold">
                    TRACE: {data.traceCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#0f2e60] text-[9px] font-bold uppercase tracking-wider pt-0.5 border-t border-dotted border-stone-300">
            <span>TOWN HALL PUBLIC HIGH SCHOOL</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-normal text-[7.5px] text-stone-500">
                {data.traceCode ? `SECURITY TRACE: ${data.traceCode}` : "OFFICIAL PROGRESS RECORD"}
              </span>
              {data.qrCodeDataUrl && (
                <img
                  src={data.qrCodeDataUrl}
                  alt="QR"
                  className="w-7 h-7 object-contain inline-block border border-[#0f2e60] p-0.5 bg-white"
                />
              )}
            </div>
            <span>VERIFIED LEDGER</span>
          </div>

        </div>
      </div>
    </div>
  );
}
