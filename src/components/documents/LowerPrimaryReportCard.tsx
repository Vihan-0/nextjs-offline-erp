import React from 'react';
import Image from 'next/image';

export interface LowerPrimaryReportCardData {
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

  // Grade assessments key -> { term1, term2, term3, term4 }
  // Values: "A+", "A", "B", "C"
  assessments?: Record<
    string,
    { term1?: string; term2?: string; term3?: string; term4?: string }
  >;

  attendance?: string;
  passedAndPromotedToClass?: string;
  teacherRemark?: string;
  schoolReopenOn?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

interface LowerPrimaryReportCardProps {
  data: LowerPrimaryReportCardData;
  className?: string;
}

// Curriculum breakdown for Academic Subjects
export const LOWER_PRIMARY_ACADEMIC_SUBJECTS = {
  left: [
    {
      subject: 'English',
      components: ['Literature/Language', 'Writing / Dictation', 'Reading / Recitation'],
    },
    {
      subject: 'Hindi',
      components: ['Literature/Language', 'Writing / Dictation', 'Reading / Recitation'],
    },
    {
      subject: 'Mathematics',
      components: ['Logic and calculation', 'Mental ability', 'Oral'],
    },
  ],
  right: [
    {
      subject: 'Environmental Education',
      components: ['Written', 'Project / Oral'],
    },
    {
      subject: 'General Awareness',
      components: ['Written', 'Oral'],
    },
    {
      subject: 'Computer',
      components: ['Theory/Practical'],
    },
    {
      subject: 'Art & Craft',
      components: ['Sketching/coloring\norigami'],
    },
    {
      subject: 'PT/Game',
      isFullSpan: true,
      components: ['PT/Game'],
    },
  ],
};

// Curriculum breakdown for Developmental Domains
export const LOWER_PRIMARY_DEVELOPMENTAL = [
  {
    category: 'Creative Development',
    items: [
      'Learning through Audio-Visual Aids',
      'Freehand Drawing Colouring',
      'Dance/Music',
    ],
  },
  {
    category: 'Physical & Motor Skill',
    items: [
      'Gross Motor Development',
      'Motor Development',
      'Freehand Co-ordination',
    ],
  },
  {
    category: 'Social Development',
    items: [
      'Courtesy and Politeness',
      'Friendliness',
      'Willingness to Learn',
      'Regularity Awareness of Personal Hygiene',
      'Eating Habits',
    ],
  },
  {
    category: 'Personality Development',
    items: ['Confidence', 'Independence', 'Responsibility'],
  },
];

export function LowerPrimaryReportCard({
  data,
  className = '',
}: LowerPrimaryReportCardProps) {
  const sessionYear = data.sessionYear || '2025-2026';
  const branch = data.branch || 'MAIN BRANCH';
  const aadhaarNo = data.aadhaarNo || '—';
  const schoolReopenOn = data.schoolReopenOn || '01.07.2026';
  const attendance = data.attendance || '188 / 198 Days (95%)';
  const passedAndPromotedToClass =
    data.passedAndPromotedToClass || 'CLASS III';
  const teacherRemark =
    data.teacherRemark ||
    'CONFIDENT, ENERGETIC & OUTSTANDING OVERALL PERFORMANCE';

  const getTermGrade = (key: string, term: 'term1' | 'term2' | 'term3' | 'term4') => {
    return data.assessments?.[key]?.[term] || '';
  };

  return (
    <div
      className={`lower-primary-report-card-root bg-white text-stone-900 mx-auto select-none print:m-0 print:p-0 ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontFamily: "'Calibri', 'Arial', sans-serif",
      }}
    >
      {/* Outer Golden/Navy Double Frame */}
      <div className="p-3 bg-white h-full flex flex-col justify-between">
        <div className="border-[2.5px] border-[#0f2e60] p-2 flex flex-col justify-between h-full space-y-1.5 text-[11px] leading-tight">
          
          {/* ========================================================= */}
          {/* 1. TOP HEADER SECTION                                     */}
          {/* ========================================================= */}
          <div className="relative pt-1 pb-1 px-2 border-b border-[#0f2e60]/30">
            {/* Logo on Top Left */}
            <div className="absolute left-2 top-0 bottom-0 flex items-center">
              <div className="w-16 h-16 relative overflow-hidden rounded-full border border-stone-200 shadow-xs bg-white">
                <img
                  src="/thphslogo.jpeg"
                  alt="Town Hall Public High School Logo"
                  className="w-full h-full object-contain block"
                />
              </div>
            </div>

            {/* School Titles & Tagline */}
            <div className="text-center pl-16 pr-4">
              <p className="text-[#c01818] italic font-serif text-[13px] tracking-wide font-medium">
                “A Tradition In Quality Education”
              </p>
              <h1 className="text-[20px] font-black text-[#c01818] tracking-tight uppercase leading-tight font-sans">
                TOWN HALL PUBLIC HIGH SCHOOL
              </h1>
              <h2 className="text-[12.5px] font-bold text-[#c01818] tracking-wider uppercase mt-0.5">
                PROGRESS REPORT- Lower Primary
              </h2>
              <p className="text-[12px] font-bold text-[#0f2e60] mt-0.5">
                Session – {sessionYear}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. STUDENT INFORMATION 2-COLUMN TABLE                     */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] overflow-hidden text-[10.5px]">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="w-[18%] py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    STUDENT'S NAME
                  </td>
                  <td className="w-[32%] py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.studentName}
                  </td>
                  <td className="w-[20%] py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    CLASS & SECTION
                  </td>
                  <td className="w-[30%] py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {data.classAndSection}
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    DATE OF BIRTH
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.dateOfBirth}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    S.R NUMBER
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase font-mono">
                    {data.srNumber}
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    FATHER'S NAME
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.fatherName}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    CONTACT NO.
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {data.contactNo}
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    MOTHER'S NAME
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60]">
                    {data.motherName}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    BRANCH
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase">
                    {branch}
                  </td>
                </tr>

                {/* Row 5 */}
                <tr>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
                    ADDRESS
                  </td>
                  <td className="py-0.5 px-2 font-bold text-stone-900 uppercase border-r border-[#0f2e60] truncate max-w-[200px]" title={data.address}>
                    {data.address}
                  </td>
                  <td className="py-0.5 px-1.5 font-bold text-[#0f2e60] uppercase border-r border-[#0f2e60] bg-stone-50/60">
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
          {/* 3. ACADEMIC EVALUATION (LEFT & RIGHT TABLES SIDE-BY-SIDE) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 gap-0 border border-[#0f2e60] text-[10px]">
            
            {/* LEFT TABLE: English, Hindi, Mathematics */}
            <div className="border-r border-[#0f2e60]">
              <table className="w-full border-collapse h-full">
                <thead>
                  <tr className="border-b border-[#0f2e60] bg-stone-50/80">
                    <th className="py-1 px-1 text-center font-bold text-[#c01818] uppercase border-r border-[#0f2e60]" colSpan={2}>
                      SUBJECT
                    </th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">I</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">II</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">III</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818]">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {/* English (3 rows) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td rowSpan={3} className="w-8 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle py-1">
                      <div className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase font-bold text-[10px] mx-auto">
                        English
                      </div>
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Literature/Language</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Literature/Language', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Literature/Language', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Literature/Language', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('English - Literature/Language', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Writing / Dictation</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Writing / Dictation', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Writing / Dictation', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Writing / Dictation', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('English - Writing / Dictation', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Reading / Recitation</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Reading / Recitation', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Reading / Recitation', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('English - Reading / Recitation', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('English - Reading / Recitation', 'term4')}</td>
                  </tr>

                  {/* Hindi (3 rows) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td rowSpan={3} className="w-8 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle py-1">
                      <div className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase font-bold text-[10px] mx-auto">
                        Hindi
                      </div>
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Literature/Language</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Literature/Language', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Literature/Language', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Literature/Language', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Hindi - Literature/Language', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Writing / Dictation</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Writing / Dictation', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Writing / Dictation', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Writing / Dictation', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Hindi - Writing / Dictation', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Reading / Recitation</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Reading / Recitation', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Reading / Recitation', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Hindi - Reading / Recitation', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Hindi - Reading / Recitation', 'term4')}</td>
                  </tr>

                  {/* Mathematics (3 rows) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td rowSpan={3} className="w-8 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle py-1">
                      <div className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase font-bold text-[10px] mx-auto">
                        Mathematics
                      </div>
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Logic and calculation</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Logic and calculation', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Logic and calculation', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Logic and calculation', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Mathematics - Logic and calculation', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Mental ability</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Mental ability', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Mental ability', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Mental ability', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Mathematics - Mental ability', 'term4')}</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Oral</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Oral', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Oral', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Mathematics - Oral', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Mathematics - Oral', 'term4')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT TABLE: Env Education, General Awareness, Computer, Art & Craft, PT/Game */}
            <div>
              <table className="w-full border-collapse h-full">
                <thead>
                  <tr className="border-b border-[#0f2e60] bg-stone-50/80">
                    <th className="py-1 px-1 text-center font-bold text-[#c01818] uppercase border-r border-[#0f2e60]" colSpan={2}>
                      SUBJECT
                    </th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">I</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">II</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">III</th>
                    <th className="w-8 py-1 text-center font-bold text-[#c01818]">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Environmental Education (2 rows) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td rowSpan={2} className="w-24 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 p-1 align-middle leading-tight">
                      Environmental<br />Education
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Written</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Written', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Written', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Written', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Environmental Education - Written', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Project / Oral</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Project / Oral', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Project / Oral', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Environmental Education - Project / Oral', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Environmental Education - Project / Oral', 'term4')}</td>
                  </tr>

                  {/* General Awareness (2 rows) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td rowSpan={2} className="w-24 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 p-1 align-middle leading-tight">
                      General<br />Awareness
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Written</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Written', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Written', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Written', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('General Awareness - Written', 'term4')}</td>
                  </tr>
                  <tr className="border-b border-[#0f2e60]">
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Oral</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Oral', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Oral', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('General Awareness - Oral', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('General Awareness - Oral', 'term4')}</td>
                  </tr>

                  {/* Computer (1 row) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td className="w-24 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 p-1">
                      Computer
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60]">Theory/Practical</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Computer - Theory/Practical', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Computer - Theory/Practical', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Computer - Theory/Practical', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Computer - Theory/Practical', 'term4')}</td>
                  </tr>

                  {/* Art & Craft (1 row) */}
                  <tr className="border-b border-[#0f2e60]">
                    <td className="w-24 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 p-1">
                      Art & Craft
                    </td>
                    <td className="py-1 px-1.5 font-medium border-r border-[#0f2e60] leading-tight">
                      Sketching/coloring<br />origami
                    </td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Art & Craft - Sketching/coloring origami', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Art & Craft - Sketching/coloring origami', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Art & Craft - Sketching/coloring origami', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('Art & Craft - Sketching/coloring origami', 'term4')}</td>
                  </tr>

                  {/* PT/Game (Full span row across right columns) */}
                  <tr>
                    <td colSpan={2} className="py-1.5 px-2 text-center font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40">
                      PT/Game
                    </td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('PT/Game', 'term1')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('PT/Game', 'term2')}</td>
                    <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('PT/Game', 'term3')}</td>
                    <td className="text-center font-bold">{getTermGrade('PT/Game', 'term4')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. DEVELOPMENTAL DOMAIN EVALUATION (FULL WIDTH TABLE)     */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] text-[10px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#0f2e60] bg-stone-50/80">
                  <th className="py-1 px-2 text-center font-bold text-[#c01818] uppercase border-r border-[#0f2e60]" colSpan={2}>
                    SUBJECT
                  </th>
                  <th className="w-16 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">I</th>
                  <th className="w-16 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">II</th>
                  <th className="w-16 py-1 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">III</th>
                  <th className="w-16 py-1 text-center font-bold text-[#c01818]">IV</th>
                </tr>
              </thead>
              <tbody>
                {/* 4.1 Creative Development */}
                <tr className="border-b border-[#0f2e60]">
                  <td rowSpan={3} className="w-[18%] p-1 text-left font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle leading-tight">
                    Creative<br />Development
                  </td>
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Learning through Audio-Visual Aids</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Learning through Audio-Visual Aids', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Learning through Audio-Visual Aids', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Learning through Audio-Visual Aids', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Learning through Audio-Visual Aids', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Freehand Drawing Colouring</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Drawing Colouring', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Drawing Colouring', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Drawing Colouring', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Freehand Drawing Colouring', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Dance/Music</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Dance/Music', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Dance/Music', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Dance/Music', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Dance/Music', 'term4')}</td>
                </tr>

                {/* 4.2 Physical & Motor Skill */}
                <tr className="border-b border-[#0f2e60]">
                  <td rowSpan={3} className="w-[18%] p-1 text-left font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle leading-tight">
                    Physical & Motor<br />Skill
                  </td>
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Gross Motor Development</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Gross Motor Development', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Gross Motor Development', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Gross Motor Development', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Gross Motor Development', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Motor Development</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Motor Development', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Motor Development', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Motor Development', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Motor Development', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Freehand Co-ordination</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Co-ordination', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Co-ordination', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Freehand Co-ordination', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Freehand Co-ordination', 'term4')}</td>
                </tr>

                {/* 4.3 Social Development */}
                <tr className="border-b border-[#0f2e60]">
                  <td rowSpan={5} className="w-[18%] p-1 text-left font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle leading-tight">
                    Social<br />Development
                  </td>
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Courtesy and Politeness</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Courtesy and Politeness', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Courtesy and Politeness', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Courtesy and Politeness', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Courtesy and Politeness', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Friendliness</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Friendliness', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Friendliness', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Friendliness', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Friendliness', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Willingness to Learn</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Willingness to Learn', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Willingness to Learn', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Willingness to Learn', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Willingness to Learn', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Regularity Awareness of Personal Hygiene</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Regularity Awareness of Personal Hygiene', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Regularity Awareness of Personal Hygiene', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Regularity Awareness of Personal Hygiene', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Regularity Awareness of Personal Hygiene', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Eating Habits</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Eating Habits', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Eating Habits', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Eating Habits', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Eating Habits', 'term4')}</td>
                </tr>

                {/* 4.4 Personality Development */}
                <tr className="border-b border-[#0f2e60]">
                  <td rowSpan={3} className="w-[18%] p-1 text-left font-bold text-[#0f2e60] border-r border-[#0f2e60] bg-stone-50/40 align-middle leading-tight">
                    Personality<br />Development
                  </td>
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Confidence</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Confidence', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Confidence', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Confidence', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Confidence', 'term4')}</td>
                </tr>
                <tr className="border-b border-[#0f2e60]">
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Independence</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Independence', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Independence', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Independence', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Independence', 'term4')}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-medium border-r border-[#0f2e60]">Responsibility</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Responsibility', 'term1')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Responsibility', 'term2')}</td>
                  <td className="text-center font-bold border-r border-[#0f2e60]">{getTermGrade('Responsibility', 'term3')}</td>
                  <td className="text-center font-bold">{getTermGrade('Responsibility', 'term4')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 5. ATTENDANCE & PROMOTION STATUS ROW                      */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] grid grid-cols-2 text-[10.5px]">
            <div className="py-1 px-2 border-r border-[#0f2e60] flex items-center gap-2">
              <span className="font-bold text-[#0f2e60]">Attendance :-</span>
              <span className="font-semibold text-stone-800">{attendance}</span>
            </div>
            <div className="py-1 px-2 flex items-center gap-2">
              <span className="font-bold text-[#0f2e60]">Passed & Promoted to Class :-</span>
              <span className="font-bold text-[#c01818] uppercase">{passedAndPromotedToClass}</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. TEACHER'S REMARK ROW                                   */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] py-1 px-2 text-[10.5px] flex items-center gap-3">
            <span className="font-bold text-[#0f2e60] whitespace-nowrap">Teacher's Remark :</span>
            <span className="font-bold text-stone-900 tracking-wide uppercase text-[10px]">
              {teacherRemark}
            </span>
          </div>

          {/* ========================================================= */}
          {/* 7. FOUR SIGNATURE BLOCKS                                  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-4 gap-2 pt-5 pb-1 text-center text-[9.5px]">
            <div>
              <div className="border-b border-[#0f2e60] mb-1 h-3" />
              <p className="font-bold text-[#c01818]">Class Teacher's Signature</p>
            </div>
            <div>
              <div className="border-b border-[#0f2e60] mb-1 h-3" />
              <p className="font-bold text-[#c01818]">Checker's Signature</p>
            </div>
            <div>
              <div className="border-b border-[#0f2e60] mb-1 h-3" />
              <p className="font-bold text-[#c01818]">Principal's Signature</p>
            </div>
            <div>
              <div className="border-b border-[#0f2e60] mb-1 h-3" />
              <p className="font-bold text-[#c01818]">Parent's/Guardian's Signature</p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 8. INDICATION GRADING KEY TABLE                           */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] text-[9.5px]">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-[#0f2e60]">
                  <td className="w-[18%] py-0.5 px-2 font-bold text-[#c01818] border-r border-[#0f2e60] bg-stone-50/50">
                    INDICATION:-
                  </td>
                  <td className="w-[15%] py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    A+
                  </td>
                  <td className="w-[15%] py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    A
                  </td>
                  <td className="w-[15%] py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    B
                  </td>
                  <td className="py-0.5 text-center font-bold text-[#c01818]">
                    C
                  </td>
                </tr>
                <tr>
                  <td className="border-r border-[#0f2e60] bg-stone-50/50"></td>
                  <td className="py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    BEST
                  </td>
                  <td className="py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    VERY GOOD
                  </td>
                  <td className="py-0.5 text-center font-bold text-[#c01818] border-r border-[#0f2e60]">
                    GOOD
                  </td>
                  <td className="py-0.5 text-center font-bold text-[#c01818]">
                    SPECIAL ATTENTION REQUIRED
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 9. SCHOOL REOPEN BAR & ANTI-TAMPER VERIFICATION          */}
          {/* ========================================================= */}
          <div className="border border-[#0f2e60] py-1 px-2 text-[10px] flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#c01818]">School Reopen on :-</span>
                <span className="font-bold text-stone-900">{schoolReopenOn}</span>
              </div>
              {data.traceCode && (
                <div className="text-[7.5px] font-mono text-stone-600">
                  SECURITY TRACE: <strong>{data.traceCode}</strong> • Scan QR to verify authentic marks
                </div>
              )}
            </div>

            {data.qrCodeDataUrl && (
              <div className="shrink-0 flex flex-col items-center bg-white p-0.5 border border-[#0f2e60] rounded">
                <img
                  src={data.qrCodeDataUrl}
                  alt="Security QR"
                  className="w-10 h-10 object-contain block"
                />
                <span className="text-[5.5px] font-mono font-bold text-[#0f2e60]">
                  VERIFY
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[#0f2e60] text-[9px] font-black uppercase tracking-widest pt-0.5 border-t border-dotted border-stone-300">
            <span>TOWN HALL PUBLIC SCHOOL</span>
            <span className="font-mono font-normal text-[7.5px] text-stone-500">
              {data.traceCode ? `TRACE: ${data.traceCode}` : "OFFICIAL PROGRESS RECORD"}
            </span>
            <span>VERIFIED LEDGER</span>
          </div>

        </div>
      </div>
    </div>
  );
}
