import React from 'react';
import Image from 'next/image';

export interface ClassIXSubjectMarks {
  assessment1?: number | string;
  halfYearly?: number | string;
  assessment2?: number | string;
  annual?: number | string;
  grandTotal?: number | string;
  grade?: string;
}

export interface ClassIXProjectGrades {
  halfYearly?: string;
  annual?: string;
}

export type TraitRating = 'Always' | 'Most of the time' | 'Some-time' | 'Rarely' | 'Never';

export interface PersonalityTraitRecord {
  halfYearly?: TraitRating;
  annual?: TraitRating;
}

export interface ClassIXReportCardData {
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

  // Academic Marks by Subject
  subjectMarks?: Record<string, ClassIXSubjectMarks>;

  // Project Grades
  projectGrades?: Record<string, ClassIXProjectGrades>;

  // Personality Development Traits
  personalityTraits?: Record<string, PersonalityTraitRecord>;

  rankInClass?: string;
  attendanceHalfYearly?: string;
  attendanceAnnual?: string;
  promotedToClass?: string;
  passedAndPromotedToClass?: string;
  teacherRemark?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

export interface ClassIXReportCardProps {
  data: ClassIXReportCardData;
  className?: string;
  isEditable?: boolean;
  onMarkChange?: (subject: string, field: "assessment1" | "halfYearly" | "assessment2" | "annual", value: string) => void;
  onMarkBlur?: (subject: string, field: "assessment1" | "halfYearly" | "assessment2" | "annual", value: string) => void;
  onProjectGradeChange?: (subject: string, term: "halfYearly" | "annual", grade: string) => void;
  onTraitChange?: (trait: string, term: "halfYearly" | "annual", rating: TraitRating) => void;
}

// 6 Core Subjects for Class IX
export const CLASS_IX_SUBJECTS: string[] = [
  'ENGLISH',
  'HINDI',
  'MATHS/HOME SCIENCE',
  'SOCIAL SCIENCE',
  'SCIENCE',
  'COMPUTER/COMMERCE/ART',
];

// Project Subjects
export const CLASS_IX_PROJECT_SUBJECTS = {
  left: ['HINDI', 'ENGLISH', 'SCIENCE', 'SOCIAL SCIENCE'],
  right: [
    'COMPUTER/COMMERCE/ART',
    "MATHEMATIC'S/HOME SCIENCE",
    'MORAL SCIENCE & PHYSICAL EDUCATION',
  ],
};

// Personality Development Traits
export const CLASS_IX_PERSONALITY_TRAITS: string[] = [
  'Is Disciplined',
  'Is Respectful',
  'Is Neat in Apperarance',
  'Is Punctual to School',
  'Is Regular in Work',
  'Follows Instructions',
];

export const RATING_OPTIONS: TraitRating[] = [
  'Always',
  'Most of the time',
  'Some-time',
  'Rarely',
  'Never',
];

// Helper to parse numeric marks
function parseMark(val: number | string | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  return isNaN(num) ? null : num;
}

// Class IX Grading Scale Logic
// A1 = 91-100 (score must strictly exceed 90)
// A2 = 81-90  (score 90 is in this band, not A1)
export function getClassIXGrade(score: number): string {
  if (score > 90) return 'A1';
  if (score >= 81) return 'A2';
  if (score >= 71) return 'B1';
  if (score >= 61) return 'B2';
  if (score >= 51) return 'C1';
  if (score >= 41) return 'C2';
  if (score >= 33) return 'D';
  if (score >= 21) return 'E1';
  return 'E2';
}

export function ClassIXReportCard({
  data,
  className = '',
  isEditable = false,
  onMarkChange,
  onMarkBlur,
  onProjectGradeChange,
  onTraitChange,
}: ClassIXReportCardProps) {
  const sessionYear = data.sessionYear || '2026-2027';
  const branch = data.branch || 'MAIN BRANCH';
  const aadhaarNo = data.aadhaarNo || '—';
  const promotedToClass = data.promotedToClass || 'CLASS X';
  const rankInClass = data.rankInClass || '1st ( R )';
  const attendanceHY = data.attendanceHalfYearly || '92 / 96';
  const attendanceAnnual = data.attendanceAnnual || '188 / 198 (95%)';
  const teacherRemark = data.teacherRemark || 'OUTSTANDING ACADEMIC RECORD WITH EXCELLENT CONDUCT';
  const schoolReopenOn = '01.07.2026';

  const GRADE_SELECT_OPTIONS = ['A+', 'A', 'B+', 'B', 'C', 'D'];

  const renderProjectCell = (subj: string, term: 'halfYearly' | 'annual') => {
    const val = data.projectGrades?.[subj]?.[term] || 'A+';
    if (!isEditable) return val;
    return (
      <select
        value={val}
        onChange={(e) => onProjectGradeChange?.(subj, term, e.target.value)}
        className="w-full text-center py-0 px-0.5 bg-indigo-50/60 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 outline-none text-[9.5px] print:border-none print:bg-transparent print:appearance-none cursor-pointer"
      >
        {GRADE_SELECT_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    );
  };

  // Math Calculations Engine
  let sumAss1 = 0;
  let hasAss1Count = 0;
  let sumHY = 0;
  let hasHYCount = 0;
  let sumAss2 = 0;
  let hasAss2Count = 0;
  let sumAnnual = 0;
  let hasAnnualCount = 0;
  let sumGrandTotal = 0;
  let totalMaxMarksEntered = 0;
  let totalMarksObtainedEntered = 0;

  const subjectRows = CLASS_IX_SUBJECTS.map((subj) => {
    const record = data.subjectMarks?.[subj] || {};
    const ass1 = parseMark(record.assessment1);
    const hy = parseMark(record.halfYearly);
    const ass2 = parseMark(record.assessment2);
    const ann = parseMark(record.annual);

    let subjectEarned = 0;
    let subjectMax = 0;

    if (ass1 !== null) {
      subjectEarned += ass1;
      subjectMax += 20; // Assessment 1 max marks
      sumAss1 += ass1;
      hasAss1Count++;
    }
    if (hy !== null) {
      subjectEarned += hy;
      subjectMax += 80; // Half Yearly max marks
      sumHY += hy;
      hasHYCount++;
    }
    if (ass2 !== null) {
      subjectEarned += ass2;
      subjectMax += 20; // Assessment 2 max marks
      sumAss2 += ass2;
      hasAss2Count++;
    }
    if (ann !== null) {
      subjectEarned += ann;
      subjectMax += 80; // Annual max marks
      sumAnnual += ann;
      hasAnnualCount++;
    }

    totalMarksObtainedEntered += subjectEarned;
    totalMaxMarksEntered += subjectMax;

    let grandTotal: number | null = null;
    if (record.grandTotal !== undefined && record.grandTotal !== null && record.grandTotal !== '') {
      grandTotal = parseMark(record.grandTotal);
    } else if (subjectMax > 0) {
      // If all 4 exams entered (max 200), grandTotal is out of 100: Math.round(subjectEarned / 2)
      // Otherwise grandTotal displays current cumulative points
      grandTotal = subjectMax === 200 ? Math.round(subjectEarned / 2) : subjectEarned;
    }

    if (grandTotal !== null) {
      sumGrandTotal += grandTotal;
    }

    // Calculate Grade strictly based on assessments conducted so far
    let calculatedGrade = '';
    if (subjectMax > 0) {
      const subjectPercentage = (subjectEarned / subjectMax) * 100;
      calculatedGrade = getClassIXGrade(subjectPercentage);
    }

    return {
      name: subj,
      assessment1: ass1 !== null ? ass1 : '',
      halfYearly: hy !== null ? hy : '',
      assessment2: ass2 !== null ? ass2 : '',
      annual: ann !== null ? ann : '',
      grandTotal: grandTotal !== null ? grandTotal : '',
      grade: calculatedGrade || record.grade || '',
    };
  });

  // Calculate Overall Percentage strictly based on max marks of assessments entered so far
  const overallPercentage =
    totalMaxMarksEntered > 0
      ? ((totalMarksObtainedEntered / totalMaxMarksEntered) * 100).toFixed(1)
      : '';

  const ass1Pct = hasAss1Count > 0 ? ((sumAss1 / (hasAss1Count * 20)) * 100).toFixed(1) + '%' : '';
  const hyPct = hasHYCount > 0 ? ((sumHY / (hasHYCount * 80)) * 100).toFixed(1) + '%' : '';
  const ass2Pct = hasAss2Count > 0 ? ((sumAss2 / (hasAss2Count * 20)) * 100).toFixed(1) + '%' : '';
  const annPct = hasAnnualCount > 0 ? ((sumAnnual / (hasAnnualCount * 80)) * 100).toFixed(1) + '%' : '';

  return (
    <div
      className={`class-ix-report-card-root bg-white text-stone-900 mx-auto select-none print:m-0 print:p-0 ${className}`}
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
                PROGRESS REPORT CLASS - IX
              </h2>
              <p className="text-[11px] font-bold text-[#0f2e60] mt-0.5">
                Session - {sessionYear}
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
          {/* 3. ACADEMIC ASSESSMENT TABLE                              */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="border-b border-[#0f2e60] bg-stone-50 font-black text-[#c01818] leading-tight">
                  <th className="w-[27%] py-1.5 px-2 text-left border-r border-[#0f2e60] uppercase tracking-wide">
                    SUBJECT
                  </th>
                  <th className="w-[12%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    ASSESSMENT
                  </th>
                  <th className="w-[13%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    HALF YEARLY
                    <br />
                    EXAMINATION
                  </th>
                  <th className="w-[12%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    ASSESSMENT
                  </th>
                  <th className="w-[13%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    ANNUAL
                    <br />
                    EXAMINATION
                  </th>
                  <th className="w-[13%] py-1 px-1 border-r border-[#0f2e60] uppercase text-[9.5px]">
                    GRAND
                    <br />
                    TOTAL
                  </th>
                  <th className="w-[10%] py-1 px-1 uppercase text-[9.5px]">
                    GRADE
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectRows.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-[#0f2e60] h-[20px]"
                  >
                    <td className="py-0.5 px-2 text-left font-bold text-stone-900 border-r border-[#0f2e60] whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="20"
                          value={row.assessment1 ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'assessment1', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'assessment1', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.assessment1
                      )}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="80"
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
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="20"
                          value={row.assessment2 ?? ''}
                          onChange={(e) => onMarkChange?.(row.name, 'assessment2', e.target.value)}
                          onBlur={(e) => onMarkBlur?.(row.name, 'assessment2', e.target.value)}
                          className="w-full h-full text-center py-0 px-0.5 bg-indigo-50/40 border border-indigo-200 rounded font-bold text-stone-900 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-[10px] print:border-none print:bg-transparent print:p-0"
                          placeholder="—"
                        />
                      ) : (
                        row.assessment2
                      )}
                    </td>
                    <td className="py-0 px-0.5 font-semibold text-stone-800 border-r border-[#0f2e60]">
                      {isEditable ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="80"
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
                    <td className="py-0.5 px-1 font-black text-stone-900 border-r border-[#0f2e60] bg-blue-50/20">
                      {row.grandTotal}
                    </td>
                    <td className="py-0.5 px-1 font-black text-[#0f2e60] text-center">
                      {row.grade}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="border-b border-[#0f2e60] font-bold text-stone-900 bg-stone-100/70 h-[20px]">
                  <td className="py-0.5 px-2 text-left text-[#0f2e60] font-black border-r border-[#0f2e60] uppercase">
                    TOTAL
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumAss1 > 0 ? sumAss1 : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumHY > 0 ? sumHY : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumAss2 > 0 ? sumAss2 : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60]">
                    {sumAnnual > 0 ? sumAnnual : ''}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] font-black text-[#c01818]">
                    {sumGrandTotal > 0 ? sumGrandTotal : ''}
                  </td>
                  <td className="py-0.5 px-1" />
                </tr>

                {/* Percentage Row */}
                <tr className="font-bold text-stone-800 bg-stone-50/80 h-[20px]">
                  <td className="py-0.5 px-2 text-left text-[#0f2e60] font-black border-r border-[#0f2e60] uppercase">
                    PERCENTAGE
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {ass1Pct}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {hyPct}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {ass2Pct}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] text-[9px]">
                    {annPct}
                  </td>
                  <td className="py-0.5 px-1 border-r border-[#0f2e60] font-black text-[#c01818] text-[9.5px]">
                    {overallPercentage ? `${overallPercentage}%` : ''}
                  </td>
                  <td className="py-0.5 px-1" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 4. GRADES :- IN PROJECT SECTION                           */}
          {/* ========================================================= */}
          <div className="space-y-0.5">
            <h3 className="text-center font-black text-[#c01818] tracking-wider text-[11px] uppercase">
              GRADES :- IN PROJECT
            </h3>
            <div className="border border-[#0f2e60] overflow-hidden text-[10px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#0f2e60] bg-stone-50/70 font-black text-[#c01818] text-[9.5px] text-center">
                    <th className="w-[24%] py-0.5 px-1.5 text-left border-r border-[#0f2e60] uppercase">SUBJECT</th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">HALF YEARLY</th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">ANNUAL</th>
                    <th className="w-[24%] py-0.5 px-1.5 text-left border-r border-[#0f2e60] uppercase">SUBJECT</th>
                    <th className="w-[13%] py-0.5 px-1 border-r border-[#0f2e60] uppercase">HALF YEARLY</th>
                    <th className="w-[13%] py-0.5 px-1 uppercase">ANNUAL</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: HINDI | COMPUTER/COMMERCE/ART */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      HINDI
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('HINDI', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('HINDI', 'annual')}
                    </td>
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      COMPUTER/COMMERCE/ART
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('COMPUTER/COMMERCE/ART', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderProjectCell('COMPUTER/COMMERCE/ART', 'annual')}
                    </td>
                  </tr>

                  {/* Row 2: ENGLISH | MATHEMATIC'S/HOME SCIENCE */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      ENGLISH
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('ENGLISH', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('ENGLISH', 'annual')}
                    </td>
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      MATHEMATIC'S/HOME SCIENCE
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell("MATHEMATIC'S/HOME SCIENCE", 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderProjectCell("MATHEMATIC'S/HOME SCIENCE", 'annual')}
                    </td>
                  </tr>

                  {/* Row 3: SCIENCE | MORAL SCIENCE & PHYSICAL EDUCATION */}
                  <tr className="border-b border-[#0f2e60] h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      SCIENCE
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('SCIENCE', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('SCIENCE', 'annual')}
                    </td>
                    <td rowSpan={2} className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60] align-middle">
                      MORAL SCIENCE & PHYSICAL EDUCATION
                    </td>
                    <td rowSpan={2} className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] align-middle">
                      {renderProjectCell('MORAL SCIENCE & PHYSICAL EDUCATION', 'halfYearly')}
                    </td>
                    <td rowSpan={2} className="py-0.5 px-1 text-center font-bold text-[#0f2e60] align-middle">
                      {renderProjectCell('MORAL SCIENCE & PHYSICAL EDUCATION', 'annual')}
                    </td>
                  </tr>

                  {/* Row 4: SOCIAL SCIENCE */}
                  <tr className="h-[18px]">
                    <td className="py-0.5 px-1.5 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                      SOCIAL SCIENCE
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60]">
                      {renderProjectCell('SOCIAL SCIENCE', 'halfYearly')}
                    </td>
                    <td className="py-0.5 px-1 text-center font-bold text-[#0f2e60]">
                      {renderProjectCell('SOCIAL SCIENCE', 'annual')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. PERSONALITY DEVELOPMENT GRID & ATTENDANCE               */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[9.5px]">
            <table className="w-full border-collapse">
              <thead>
                {/* Super Header */}
                <tr className="border-b border-[#0f2e60] font-black text-[#c01818] bg-stone-50/70 text-center">
                  <th rowSpan={2} className="w-[27%] py-1 px-1.5 text-left border-r border-[#0f2e60] uppercase text-[10px]">
                    PERSONALITY
                    <br />
                    DEVELOPMENT
                  </th>
                  <th colSpan={5} className="py-0.5 border-r border-[#0f2e60] uppercase text-[10px]">
                    HALF YEARLY
                  </th>
                  <th colSpan={5} className="py-0.5 uppercase text-[10px]">
                    ANNUAL
                  </th>
                </tr>
                {/* Sub Header for Ratings */}
                <tr className="border-b border-[#0f2e60] font-bold text-[#0f2e60] bg-white text-center text-[8.5px]">
                  {/* Half Yearly Sub-columns */}
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Always</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60] leading-none">Most of<br />the time</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Some-time</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Rarely</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Never</th>
                  {/* Annual Sub-columns */}
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Always</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60] leading-none">Most of<br />the time</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Some-time</th>
                  <th className="w-[7.3%] py-0.5 px-0.5 border-r border-[#0f2e60]">Rarely</th>
                  <th className="w-[7.3%] py-0.5 px-0.5">Never</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_IX_PERSONALITY_TRAITS.map((trait) => {
                  const traitData = data.personalityTraits?.[trait] || {
                    halfYearly: 'Always',
                    annual: 'Always',
                  };

                  return (
                    <tr key={trait} className="border-b border-[#0f2e60] h-[17px]">
                      <td className="py-0.5 px-1.5 font-bold text-stone-900 border-r border-[#0f2e60] whitespace-nowrap">
                        {trait}
                      </td>

                      {/* Half Yearly 5 Options */}
                      {RATING_OPTIONS.map((opt) => (
                        <td
                          key={`hy-${opt}`}
                          onClick={() => isEditable && onTraitChange?.(trait, 'halfYearly', opt)}
                          className={`py-0.5 px-0.5 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] text-[11px] ${
                            isEditable ? 'cursor-pointer hover:bg-indigo-100/50 select-none' : ''
                          }`}
                          title={isEditable ? `Set ${trait} (Half Yearly) to ${opt}` : undefined}
                        >
                          {traitData.halfYearly === opt ? '✓' : ''}
                        </td>
                      ))}

                      {/* Annual 5 Options */}
                      {RATING_OPTIONS.map((opt, idx) => (
                        <td
                          key={`ann-${opt}`}
                          onClick={() => isEditable && onTraitChange?.(trait, 'annual', opt)}
                          className={`py-0.5 px-0.5 text-center font-bold text-[#0f2e60] text-[11px] ${
                            idx < 4 ? 'border-r border-[#0f2e60]' : ''
                          } ${isEditable ? 'cursor-pointer hover:bg-indigo-100/50 select-none' : ''}`}
                          title={isEditable ? `Set ${trait} (Annual) to ${opt}` : undefined}
                        >
                          {traitData.annual === opt ? '✓' : ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Rank in Class & Attendance Row */}
                <tr className="h-[20px] font-bold text-stone-900 bg-stone-50/50">
                  <td className="py-0.5 px-1.5 text-[#0f2e60] uppercase border-r border-[#0f2e60] font-black">
                    Rank in Class
                  </td>
                  <td colSpan={4} className="py-0.5 px-2 text-left font-black text-stone-900 border-r border-[#0f2e60]">
                    {rankInClass}
                  </td>
                  <td colSpan={1} className="py-0.5 px-1 text-center font-black text-[#0f2e60] uppercase border-r border-[#0f2e60]">
                    Attendance
                  </td>
                  <td colSpan={2} className="py-0.5 px-1 text-left border-r border-[#0f2e60]">
                    <span className="text-[#0f2e60] font-bold">Half Yearly:-</span>{' '}
                    <span className="font-semibold text-stone-900">{attendanceHY}</span>
                  </td>
                  <td colSpan={3} className="py-0.5 px-1 text-left">
                    <span className="text-[#0f2e60] font-bold">Annual :-</span>{' '}
                    <span className="font-semibold text-stone-900">{attendanceAnnual}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 6. SIGNATURE BLOCKS (4 Columns)                           */}
          {/* ========================================================= */}
          <div className="pt-3 pb-1">
            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Class Teacher */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[9.5px] font-black text-[#c01818] uppercase leading-tight">
                  Class Teacher's
                  <br />
                  Signature
                </span>
              </div>

              {/* Checker */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[9.5px] font-black text-[#c01818] uppercase leading-tight">
                  Checker's
                  <br />
                  Signature
                </span>
              </div>

              {/* Principal */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[9.5px] font-black text-[#c01818] uppercase leading-tight">
                  Principal's
                  <br />
                  Signature
                </span>
              </div>

              {/* Parent / Guardian */}
              <div className="flex flex-col items-center">
                <div className="w-4/5 border-b border-dashed border-[#c01818] mb-1"></div>
                <span className="text-[9.5px] font-black text-[#c01818] uppercase leading-tight">
                  Parent's/Guardian's
                  <br />
                  Signature
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 7. PROMOTION RULE & GRADING SCALE KEY                     */}
          {/* ========================================================= */}
          <div className="border-t border-[#0f2e60]/30 pt-1 space-y-1">
            {/* Promoted To Header */}
            <div className="font-black text-[#0f2e60] text-[10px] uppercase flex items-center gap-2">
              <span>PROMOTED TO CLASS :-</span>
              <span className="text-stone-900 font-bold underline decoration-dotted">{promotedToClass}</span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-start text-[8.5px] leading-tight">
              {/* Grading Scale Table (4 Cols) */}
              <div className="col-span-4 border border-[#0f2e60] overflow-hidden">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="border-b border-[#0f2e60] bg-stone-50 font-black text-[#0f2e60]">
                      <th className="w-1/2 py-0.5 border-r border-[#0f2e60]">MARK</th>
                      <th className="w-1/2 py-0.5">GRADE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0f2e60]/60 font-semibold text-stone-800">
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">91-100</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">A1</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">81-90</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">A2</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">71-80</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">B1</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">61-70</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">B2</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">51-60</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">C1</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">41-50</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">C2</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">33-40</td>
                      <td className="py-0.5 font-bold text-[#0f2e60]">D</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">21-32</td>
                      <td className="py-0.5 font-bold text-amber-700">E1</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 border-r border-[#0f2e60]">20 & BELOW</td>
                      <td className="py-0.5 font-bold text-red-700">E2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Promotion Rule Text Block (8 Cols) */}
              <div className="col-span-8 space-y-1 text-[#0f2e60]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-black uppercase tracking-wider text-left text-[9.5px]">
                      PROMOTION RULE & ANTI-TAMPER VERIFICATION
                    </div>
                    <div className="space-y-0.5 text-stone-900 leading-[1.3] pl-1 font-medium text-[8.5px]">
                      <p>• The Passing Mark in each Subject is 33%</p>
                      <p>
                        • Class IX & X students must Pass in Hindi and any four major subjects.
                      </p>
                      <p className="font-bold text-[#0f2e60]">• Principal's decision with regard to promotion is final.</p>
                      {data.traceCode && (
                        <p className="font-mono text-[7.5px] text-stone-600 font-bold mt-1">
                          SECURITY TRACE: {data.traceCode} • Scan QR to verify authentic marks.
                        </p>
                      )}
                    </div>
                  </div>

                  {data.qrCodeDataUrl && (
                    <div className="shrink-0 flex flex-col items-center bg-white p-0.5 border border-[#0f2e60] rounded">
                      <img
                        src={data.qrCodeDataUrl}
                        alt="Security QR"
                        className="w-11 h-11 object-contain block"
                      />
                      <span className="text-[6px] font-mono font-bold text-[#0f2e60]">
                        VERIFY
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* School Name Bottom Footer Stamp */}
          <div className="flex items-center justify-between text-[#0f2e60] text-[8.5px] font-bold uppercase tracking-wider pt-0.5 border-t border-dotted border-stone-300">
            <span>TOWN HALL PUBLIC HIGH SCHOOL</span>
            <span className="font-mono font-normal text-[7.5px] text-stone-500">
              {data.traceCode ? `TRACE: ${data.traceCode}` : "OFFICIAL PROGRESS RECORD"}
            </span>
            <span>GOVERNANCE LEDGER ACTIVE</span>
          </div>

        </div>
      </div>
    </div>
  );
}
