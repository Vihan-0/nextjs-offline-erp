import React from 'react';
import Image from 'next/image';

export interface PrePrimaryAssessmentRow {
  category: string;
  subMetric: string;
  term1?: string; // e.g. "****", "A", etc.
  term2?: string;
  term3?: string;
  term4?: string;
}

export interface PrePrimaryReportCardData {
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
  
  // Assessment rows
  assessments?: Record<string, { term1?: string; term2?: string; term3?: string; term4?: string }>;
  
  // Bottom fields
  attendance?: {
    term1?: string;
    term2?: string;
    term3?: string;
    term4?: string;
    total?: string;
  };
  teacherRemark?: string;
  passedAndPromotedToClass?: string;
  schoolReopenOn?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

interface PrePrimaryReportCardProps {
  data: PrePrimaryReportCardData;
  className?: string;
}

// Predefined curriculum structure matching the exact Town Hall Pre-Primary template
export const PRE_PRIMARY_CURRICULUM = [
  {
    category: 'English',
    items: ['Reading / Recitation', 'Writing / Dictation', 'Written / Activity'],
  },
  {
    category: 'Hindi',
    items: ['Reading / Recitation', 'Writing / Dictation', 'Written / Activity'],
  },
  {
    category: 'Maths',
    items: ['Written', 'Activity', 'Numerical Concept'],
  },
  {
    category: 'Environmental Learning',
    items: ['Theme Knowledge', 'General Awareness', 'Conversation Skill', 'Activity'],
  },
  {
    category: 'Creative Development',
    items: ['Learning through Audio-Visual Aids', 'Freehand Drawing Colouring', 'Dance/Music'],
  },
  {
    category: 'Social Development',
    items: [
      'Courtesy and Politeness',
      'Friendliness',
      'Willingness to Learn/Regularity',
      'Awareness of personal Hygiene',
      'Eating Habits',
    ],
  },
  {
    category: 'Physical & motor Development',
    items: ['Gross Motor Development', 'Motor Development', 'Independence / Responsibility'],
  },
];

// Helper to format grade string into stars (* / ** / *** / ****)
export function formatStars(grade?: string | null): string {
  if (!grade) return '';
  const clean = grade.trim().toUpperCase();
  if (clean === '****' || clean === '4' || clean === 'A+' || clean === 'BEST') return '****';
  if (clean === '***' || clean === '3' || clean === 'A' || clean === 'BETTER') return '***';
  if (clean === '**' || clean === '2' || clean === 'B' || clean === 'GOOD') return '**';
  if (clean === '*' || clean === '1' || clean === 'C' || clean === 'D' || clean === 'SPECIAL ATTENTION') return '*';
  return grade;
}

export function PrePrimaryReportCard({ data, className = '' }: PrePrimaryReportCardProps) {
  const sessionYear = data.sessionYear || '2026-2027';
  const branch = data.branch || 'MAIN BRANCH';
  const aadhaarNo = data.aadhaarNo || '—';
  const schoolReopenOn = data.schoolReopenOn || '01.07.2027';

  // Helper to get grade for a sub-metric
  const getGrade = (subMetric: string, term: 'term1' | 'term2' | 'term3' | 'term4'): string => {
    if (!data.assessments) return '';
    const record = data.assessments[subMetric] || data.assessments[subMetric.toLowerCase()];
    if (!record) return '';
    return formatStars(record[term]);
  };

  return (
    <div
      className={`pre-primary-report-card-root bg-white text-black font-sans box-border relative mx-auto ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        border: '3px solid #0f295b',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#000000',
        fontSize: '11px',
        lineHeight: '1.2',
      }}
    >
      <div>
        {/* 1. Header Section */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: '10px' }}>
          {/* Tagline at top in red script font */}
          <div
            style={{
              color: '#d32f2f',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '2px',
            }}
          >
            “A Tradition In Quality Education”
          </div>

          {/* School Logo placed on the left */}
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '4px',
              width: '65px',
              height: '65px',
            }}
          >
            <img
              src="/thphslogo.jpeg"
              alt="School Crest"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* School Name */}
          <h1
            style={{
              color: '#d32f2f',
              fontSize: '24px',
              fontWeight: '900',
              letterSpacing: '0.5px',
              margin: '2px 0 0 0',
              textTransform: 'uppercase',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            TOWN HALL PUBLIC HIGH SCHOOL
          </h1>

          {/* Report Subtitle */}
          <h2
            style={{
              color: '#d32f2f',
              fontSize: '13px',
              fontWeight: '800',
              margin: '3px 0 0 0',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            PROGRESS REPORT- PRE - PRIMARY
          </h2>

          {/* Session */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: '800',
              color: '#000000',
              marginTop: '2px',
            }}
          >
            Session - {sessionYear}
          </div>
        </div>

        {/* 2. Student Demographics Table */}
        <div
          style={{
            border: '2px solid #0f295b',
            marginBottom: '10px',
            fontSize: '10.5px',
            fontWeight: '700',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1.5px solid #0f295b' }}>
                <td style={{ width: '17%', padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  STUDENT'S NAME
                </td>
                <td style={{ width: '43%', padding: '4px 6px', borderRight: '2px solid #0f295b', color: '#000000', fontWeight: '900', textTransform: 'uppercase' }}>
                  {data.studentName || '—'}
                </td>
                <td style={{ width: '18%', padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  CLASS & SECTION
                </td>
                <td style={{ width: '22%', padding: '4px 6px', color: '#000000', fontWeight: '900', textTransform: 'uppercase' }}>
                  {data.classAndSection || 'PRE-PRIMARY A'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1.5px solid #0f295b' }}>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  DATE OF BIRTH
                </td>
                <td style={{ padding: '4px 6px', borderRight: '2px solid #0f295b', color: '#000000', fontWeight: '800' }}>
                  {data.dateOfBirth || '—'}
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  S.R NUMBER
                </td>
                <td style={{ padding: '4px 6px', color: '#000000', fontWeight: '900' }}>
                  {data.srNumber}
                </td>
              </tr>
              <tr style={{ borderBottom: '1.5px solid #0f295b' }}>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  FATHER'S NAME
                </td>
                <td style={{ padding: '4px 6px', borderRight: '2px solid #0f295b', color: '#000000', fontWeight: '800', textTransform: 'uppercase' }}>
                  {data.fatherName || '—'}
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  CONTACT NO.
                </td>
                <td style={{ padding: '4px 6px', color: '#000000', fontWeight: '800' }}>
                  {data.contactNo || '—'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1.5px solid #0f295b' }}>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  MOTHER'S NAME
                </td>
                <td style={{ padding: '4px 6px', borderRight: '2px solid #0f295b', color: '#000000', fontWeight: '800', textTransform: 'uppercase' }}>
                  {data.motherName || '—'}
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  BRANCH
                </td>
                <td style={{ padding: '4px 6px', color: '#000000', fontWeight: '800', textTransform: 'uppercase' }}>
                  {branch}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  ADDRESS
                </td>
                <td style={{ padding: '4px 6px', borderRight: '2px solid #0f295b', color: '#000000', fontWeight: '800', textTransform: 'uppercase' }}>
                  {data.address || '—'}
                </td>
                <td style={{ padding: '4px 6px', borderRight: '1.5px solid #0f295b', color: '#0f295b', fontWeight: '800' }}>
                  AADHAAR NO.
                </td>
                <td style={{ padding: '4px 6px', color: '#000000', fontWeight: '800' }}>
                  {aadhaarNo}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Main Assessment Grid */}
        <div
          style={{
            border: '2px solid #0f295b',
            marginBottom: '10px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #0f295b' }}>
                <th
                  colSpan={2}
                  style={{
                    padding: '6px 8px',
                    color: '#d32f2f',
                    fontSize: '12px',
                    fontWeight: '900',
                    textAlign: 'center',
                    borderRight: '2px solid #0f295b',
                    letterSpacing: '0.5px',
                  }}
                >
                  SUBJECT
                </th>
                <th
                  style={{
                    width: '12%',
                    padding: '6px 4px',
                    color: '#d32f2f',
                    fontSize: '13px',
                    fontWeight: '900',
                    textAlign: 'center',
                    borderRight: '1.5px solid #0f295b',
                  }}
                >
                  I
                </th>
                <th
                  style={{
                    width: '12%',
                    padding: '6px 4px',
                    color: '#d32f2f',
                    fontSize: '13px',
                    fontWeight: '900',
                    textAlign: 'center',
                    borderRight: '1.5px solid #0f295b',
                  }}
                >
                  II
                </th>
                <th
                  style={{
                    width: '12%',
                    padding: '6px 4px',
                    color: '#d32f2f',
                    fontSize: '13px',
                    fontWeight: '900',
                    textAlign: 'center',
                    borderRight: '1.5px solid #0f295b',
                  }}
                >
                  III
                </th>
                <th
                  style={{
                    width: '12%',
                    padding: '6px 4px',
                    color: '#d32f2f',
                    fontSize: '13px',
                    fontWeight: '900',
                    textAlign: 'center',
                  }}
                >
                  IV
                </th>
              </tr>
            </thead>
            <tbody>
              {PRE_PRIMARY_CURRICULUM.map((group, groupIdx) => (
                <React.Fragment key={group.category}>
                  {group.items.map((item, itemIdx) => {
                    const isLastInGroup = itemIdx === group.items.length - 1;
                    const isLastOverall =
                      groupIdx === PRE_PRIMARY_CURRICULUM.length - 1 && isLastInGroup;

                    return (
                      <tr
                        key={item}
                        style={{
                          borderBottom: isLastOverall ? 'none' : isLastInGroup ? '2px solid #0f295b' : '1px solid #0f295b',
                        }}
                      >
                        {/* Category cell with rowspan for first item */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={group.items.length}
                            style={{
                              width: '26%',
                              padding: '4px 6px',
                              fontWeight: '900',
                              color: '#0f295b',
                              verticalAlign: 'middle',
                              borderRight: '1.5px solid #0f295b',
                              fontSize: '10.5px',
                              lineHeight: '1.15',
                            }}
                          >
                            {group.category}
                          </td>
                        )}

                        {/* Sub-metric text */}
                        <td
                          style={{
                            width: '26%',
                            padding: '3.5px 6px',
                            fontWeight: '700',
                            color: '#0f295b',
                            borderRight: '2px solid #0f295b',
                            fontSize: '10px',
                            lineHeight: '1.15',
                          }}
                        >
                          {item}
                        </td>

                        {/* Term 1 */}
                        <td
                          style={{
                            padding: '2px 4px',
                            textAlign: 'center',
                            fontWeight: '900',
                            color: '#d32f2f',
                            fontSize: '12px',
                            letterSpacing: '1px',
                            borderRight: '1.5px solid #0f295b',
                          }}
                        >
                          {getGrade(item, 'term1')}
                        </td>

                        {/* Term 2 */}
                        <td
                          style={{
                            padding: '2px 4px',
                            textAlign: 'center',
                            fontWeight: '900',
                            color: '#d32f2f',
                            fontSize: '12px',
                            letterSpacing: '1px',
                            borderRight: '1.5px solid #0f295b',
                          }}
                        >
                          {getGrade(item, 'term2')}
                        </td>

                        {/* Term 3 */}
                        <td
                          style={{
                            padding: '2px 4px',
                            textAlign: 'center',
                            fontWeight: '900',
                            color: '#d32f2f',
                            fontSize: '12px',
                            letterSpacing: '1px',
                            borderRight: '1.5px solid #0f295b',
                          }}
                        >
                          {getGrade(item, 'term3')}
                        </td>

                        {/* Term 4 */}
                        <td
                          style={{
                            padding: '2px 4px',
                            textAlign: 'center',
                            fontWeight: '900',
                            color: '#d32f2f',
                            fontSize: '12px',
                            letterSpacing: '1px',
                          }}
                        >
                          {getGrade(item, 'term4')}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Bottom Summary Rows (Attendance, Remarks, Promotion) */}
        <div
          style={{
            border: '2px solid #0f295b',
            marginBottom: '16px',
            fontSize: '10.5px',
            fontWeight: '800',
          }}
        >
          {/* Attendance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1.5px solid #0f295b',
              padding: '4px 8px',
              color: '#0f295b',
            }}
          >
            <span style={{ width: '130px', fontWeight: '900' }}>Attendance :-</span>
            <span style={{ color: '#000000', fontWeight: '800' }}>
              {data.attendance?.total ||
                (data.attendance?.term1 ? `I: ${data.attendance.term1} | II: ${data.attendance.term2 || '—'} | III: ${data.attendance.term3 || '—'} | IV: ${data.attendance.term4 || '—'}` : '—')}
            </span>
          </div>

          {/* Teacher's Remark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1.5px solid #0f295b',
              minHeight: '26px',
              color: '#0f295b',
            }}
          >
            <span
              style={{
                width: '180px',
                padding: '4px 8px',
                borderRight: '1.5px solid #0f295b',
                fontWeight: '900',
              }}
            >
              Teacher's Remark
            </span>
            <span
              style={{
                flex: 1,
                padding: '4px 8px',
                color: '#000000',
                fontWeight: '800',
                textTransform: 'uppercase',
              }}
            >
              {data.teacherRemark || 'EXCELLENT PROGRESS & ACTIVE PARTICIPATION'}
            </span>
          </div>

          {/* Passed & Promoted */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              color: '#0f295b',
            }}
          >
            <span style={{ width: '220px', fontWeight: '900' }}>Passed & Promoted to Class :-</span>
            <span style={{ color: '#000000', fontWeight: '900', textTransform: 'uppercase' }}>
              {data.passedAndPromotedToClass || 'CLASS I'}
            </span>
          </div>
        </div>

        {/* 5. Signatures Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            margin: '18px 0 10px 0',
            textAlign: 'center',
            fontSize: '10.5px',
          }}
        >
          {/* Class Teacher */}
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ borderBottom: '1.5px dashed #d32f2f', height: '24px', marginBottom: '4px' }} />
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Class Teacher's</div>
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Signature</div>
          </div>

          {/* Checker */}
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ borderBottom: '1.5px dashed #d32f2f', height: '24px', marginBottom: '4px' }} />
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Checker's</div>
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Signature</div>
          </div>

          {/* Principal */}
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ borderBottom: '1.5px dashed #d32f2f', height: '24px', marginBottom: '4px' }} />
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Principal's</div>
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Signature</div>
          </div>

          {/* Parent/Guardian */}
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div style={{ borderBottom: '1.5px dashed #d32f2f', height: '24px', marginBottom: '4px' }} />
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Parent's/Guardian's</div>
            <div style={{ color: '#d32f2f', fontWeight: '900' }}>Signature</div>
          </div>
        </div>

        {/* School Reopen Line */}
        <div
          style={{
            color: '#0f295b',
            fontWeight: '900',
            fontSize: '10.5px',
            marginBottom: '10px',
          }}
        >
          SCHOOL REOPEN ON:- <span style={{ color: '#000000', fontWeight: '800' }}>{schoolReopenOn}</span>
        </div>

        {/* 6. Indication Legend / Grade Key */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1.5px solid #0f295b',
            borderBottom: '1.5px solid #0f295b',
            padding: '6px 4px',
            fontSize: '10px',
            fontWeight: '900',
          }}
        >
          <div style={{ color: '#d32f2f', fontWeight: '900', width: '90px' }}>INDICATION:-</div>

          {/* 4 Stars - BEST */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#d32f2f', fontSize: '12px', letterSpacing: '1.5px' }}>****</div>
            <div style={{ color: '#000000', fontWeight: '900', fontSize: '9.5px' }}>BEST</div>
          </div>

          {/* 3 Stars - BETTER */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#d32f2f', fontSize: '12px', letterSpacing: '1.5px' }}>***</div>
            <div style={{ color: '#000000', fontWeight: '900', fontSize: '9.5px' }}>BETTER</div>
          </div>

          {/* 2 Stars - GOOD */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#d32f2f', fontSize: '12px', letterSpacing: '1.5px' }}>**</div>
            <div style={{ color: '#000000', fontWeight: '900', fontSize: '9.5px' }}>GOOD</div>
          </div>

          {/* 1 Star - SPECIAL ATTENTION REQUIRED */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#d32f2f', fontSize: '12px' }}>*</div>
            <div style={{ color: '#d32f2f', fontWeight: '900', fontSize: '9.5px' }}>
              SPECIAL ATTENTION REQUIRED
            </div>
          </div>
        </div>
      </div>

      {/* 7. Bottom School Title & Anti-Tamper Verification Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '6px',
          paddingTop: '4px',
          borderTop: '1px dotted #ccc',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontWeight: '900',
              fontSize: '10px',
              color: '#000000',
              letterSpacing: '0.5px',
            }}
          >
            TOWN HALL PUBLIC HIGH SCHOOL
          </div>
          {data.traceCode && (
            <div style={{ fontSize: '7.5px', fontFamily: 'monospace', color: '#555' }}>
              SECURITY TRACE: <strong>{data.traceCode}</strong> • Scan QR to verify authentic marks
            </div>
          )}
        </div>

        {data.qrCodeDataUrl && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#fff',
              padding: '2px',
              border: '1px solid #000',
              borderRadius: '2px',
            }}
          >
            <img
              src={data.qrCodeDataUrl}
              alt="Security QR"
              style={{ width: '40px', height: '40px', display: 'block' }}
            />
            <span style={{ fontSize: '5.5px', fontFamily: 'monospace', fontWeight: 'bold' }}>
              VERIFY
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
