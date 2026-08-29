import React from "react";
import Image from "next/image";

export interface SRProgressionSession {
  yearNumber: number; // 1 to 10
  sessionYear?: string; // e.g. "2023-2024"
  className?: string; // e.g. "Class I"
  section?: string; // e.g. "A"
  rollNumber?: string; // e.g. "14"
  annualAttendance?: number | null;
  annualTotalDays?: number | null;
  attendancePercentage?: string | null;
  resultStatus?: string | null; // e.g. "Promoted to Class II", "Passed"
  rank?: number | string | null;
  remarks?: string | null;
  isRecorded: boolean;
}

export interface SRBackPageData {
  srNumber: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dateOfBirthFormatted: string; // e.g. "15/08/2016"
  dateOfBirthWords?: string; // e.g. "Fifteenth August Two Thousand Sixteen"
  admissionDateFormatted?: string;
  admissionClass?: string;
  category?: string;
  nationality?: string;
  residentialAddress?: string;
  sessions: SRProgressionSession[];
  schoolName?: string;
  schoolTagline?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

interface SRBackPageProps {
  data: SRBackPageData;
  className?: string;
}

// Helper to format attendance cell
export function formatAttendanceRecord(session: SRProgressionSession): string {
  if (!session.isRecorded) return "";
  const attended = session.annualAttendance;
  const total = session.annualTotalDays;

  if (attended !== undefined && attended !== null && total !== undefined && total !== null && total > 0) {
    const pct = ((attended / total) * 100).toFixed(1);
    return `${attended} / ${total} (${pct}%)`;
  }
  if (attended !== undefined && attended !== null) {
    return `${attended} Days`;
  }
  return "—";
}

export function SRBackPage({ data, className = "" }: SRBackPageProps) {
  // Ensure we have exactly 10 rows for standard 10-year progression ledger
  const displaySessions: SRProgressionSession[] = Array.from({ length: 10 }).map((_, idx) => {
    const yearNumber = idx + 1;
    const existing = data.sessions.find((s) => s.yearNumber === yearNumber);
    if (existing) {
      return existing;
    }
    return {
      yearNumber,
      isRecorded: false,
    };
  });

  return (
    <div
      className={`sr-back-page-root w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-[8mm] sm:p-[10mm] box-border relative flex flex-col justify-between font-serif ${className}`}
      style={{
        boxSizing: "border-box",
      }}
    >
      {/* Outer Double Border Frame standard on official Indian Scholar Register Ledgers */}
      <div className="w-full h-full border-[3px] border-[#0f2e60] p-1.5 flex flex-col justify-between rounded-xs">
        <div className="w-full border border-[#0f2e60] p-4 flex flex-col flex-1 justify-between">
          
          {/* Top Section: Official School Header & Register Title */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#0f2e60] pb-3 mb-3">
              <div className="w-16 h-16 relative shrink-0">
                <img
                  src="/thphslogo.jpeg"
                  alt="School Emblem"
                  className="w-full h-full object-contain block"
                />
              </div>

              <div className="text-center flex-1 px-2">
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-[#991b1b] font-serif leading-tight">
                  {data.schoolName || "TOWN HALL PUBLIC HIGH SCHOOL"}
                </h1>
                <p className="text-xs sm:text-[13px] italic font-semibold text-[#0f2e60]">
                  {data.schoolTagline || "(A Tradition in Quality Education)"}
                </p>
                <p className="text-[11px] text-stone-700 font-sans tracking-tight mt-0.5">
                  {data.schoolAddress || "Kundari Rakabganj, Ramapuram, Lucknow - 226004"}
                </p>
              </div>

              {/* Scholar Reg / Folio Badge */}
              <div className="border-2 border-[#0f2e60] rounded-sm p-1.5 text-center min-w-[90px] shrink-0 bg-stone-50">
                <span className="block text-[9px] font-sans font-bold uppercase tracking-wider text-stone-600">
                  SCHOLAR NO.
                </span>
                <span className="block text-base font-mono font-black text-[#0f2e60]">
                  {data.srNumber}
                </span>
              </div>
            </div>

            {/* Document Title Ribbon */}
            <div className="bg-[#0f2e60] text-white py-1 px-4 text-center rounded-xs shadow-xs mb-3">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest font-sans">
                SCHOLAR'S REGISTER — 10-YEAR ACADEMIC PROGRESSION RECORD (S.R. BACK FOLIO)
              </h2>
            </div>

            {/* Student Demographic Summary Banner */}
            <div className="bg-stone-50 border border-stone-300 rounded-xs p-3 mb-4 text-xs font-sans text-stone-900 leading-relaxed">
              <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                <div className="col-span-12 sm:col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">1. Student's Full Name:</span>
                  <span className="font-black text-sm uppercase text-[#0f2e60] border-b border-dotted border-stone-400 flex-1 truncate">
                    {data.studentName}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">2. Date of Birth:</span>
                  <span className="font-bold text-stone-900 border-b border-dotted border-stone-400 flex-1">
                    {data.dateOfBirthFormatted}
                    {data.dateOfBirthWords ? (
                      <span className="text-[11px] text-stone-600 font-normal italic ml-1">
                        ({data.dateOfBirthWords})
                      </span>
                    ) : null}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">3. Father's Name:</span>
                  <span className="font-semibold uppercase text-stone-900 border-b border-dotted border-stone-400 flex-1 truncate">
                    {data.fatherName || "—"}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-6 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">4. Mother's Name:</span>
                  <span className="font-semibold uppercase text-stone-900 border-b border-dotted border-stone-400 flex-1 truncate">
                    {data.motherName || "—"}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-4 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">5. Category:</span>
                  <span className="font-semibold text-stone-900 border-b border-dotted border-stone-400 flex-1">
                    {data.category || "General"}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-4 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">6. Class Admitted:</span>
                  <span className="font-semibold text-stone-900 border-b border-dotted border-stone-400 flex-1">
                    {data.admissionClass || data.sessions[0]?.className || "NURSERY"}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-4 flex items-baseline gap-2">
                  <span className="font-bold text-stone-700 shrink-0">7. Admission Date:</span>
                  <span className="font-semibold text-stone-900 border-b border-dotted border-stone-400 flex-1">
                    {data.admissionDateFormatted || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section: Official 10-Year Progression Table */}
          <div className="flex-1 my-1">
            <div className="border-2 border-[#0f2e60] overflow-hidden rounded-xs">
              <table className="w-full border-collapse text-left font-sans text-xs">
                <thead>
                  <tr className="bg-[#0f2e60] text-white text-center font-bold text-[11px] leading-tight divide-x divide-white/20">
                    <th className="py-2.5 px-2 w-[5%]">Year No.</th>
                    <th className="py-2.5 px-3 w-[15%]">Academic Session</th>
                    <th className="py-2.5 px-3 w-[18%]">Class & Section</th>
                    <th className="py-2.5 px-2 w-[9%]">Roll No.</th>
                    <th className="py-2.5 px-3 w-[20%]">Annual Attendance</th>
                    <th className="py-2.5 px-3 w-[20%]">Annual Result / Status</th>
                    <th className="py-2.5 px-2 w-[13%]">Initials / Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300 text-stone-900 text-xs">
                  {displaySessions.map((session, index) => {
                    const isRecorded = session.isRecorded;
                    const rowBg = isRecorded
                      ? index % 2 === 0
                        ? "bg-white"
                        : "bg-stone-50/70"
                      : index % 2 === 0
                      ? "bg-white"
                      : "bg-stone-50/30";

                    return (
                      <tr
                        key={session.yearNumber}
                        className={`${rowBg} divide-x divide-stone-300 transition-colors h-[28px]`}
                      >
                        {/* Year Number */}
                        <td className="py-1 px-2 text-center font-mono font-bold text-stone-700">
                          {session.yearNumber}
                        </td>

                        {/* Session Year */}
                        <td className="py-1 px-3 text-center font-semibold text-stone-900">
                          {isRecorded && session.sessionYear ? (
                            <span className="font-mono">{session.sessionYear}</span>
                          ) : (
                            <span className="text-stone-300 select-none">••••-••••</span>
                          )}
                        </td>

                        {/* Class Name & Section */}
                        <td className="py-1 px-3 font-medium">
                          {isRecorded && session.className ? (
                            <span className="font-bold text-[#0f2e60] uppercase">
                              {session.className}
                              {session.section ? ` - ${session.section}` : ""}
                            </span>
                          ) : (
                            <span className="text-stone-300 select-none">—</span>
                          )}
                        </td>

                        {/* Roll Number */}
                        <td className="py-1 px-2 text-center font-mono font-semibold text-stone-800">
                          {isRecorded && session.rollNumber ? session.rollNumber : "—"}
                        </td>

                        {/* Annual Attendance */}
                        <td className="py-1 px-3 text-center font-medium">
                          {isRecorded ? (
                            <span className="font-semibold text-stone-800">
                              {formatAttendanceRecord(session)}
                            </span>
                          ) : (
                            <span className="text-stone-300 select-none">— / —</span>
                          )}
                        </td>

                        {/* Annual Result / Status */}
                        <td className="py-1 px-3">
                          {isRecorded ? (
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`font-bold text-xs uppercase ${
                                  session.resultStatus?.toLowerCase().includes("promoted") ||
                                  session.resultStatus?.toLowerCase().includes("pass")
                                    ? "text-emerald-800"
                                    : session.resultStatus?.toLowerCase().includes("detain")
                                    ? "text-red-700"
                                    : "text-stone-800"
                                }`}
                              >
                                {session.resultStatus || "Promoted"}
                              </span>
                              {session.rank ? (
                                <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded font-bold">
                                  Rank #{session.rank}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-stone-300 select-none">_________________</span>
                          )}
                        </td>

                        {/* Teacher Initials / Signature */}
                        <td className="py-1 px-2 text-center text-[10px] text-stone-400">
                          {isRecorded ? (
                            <span className="font-serif italic text-stone-700">Verified</span>
                          ) : (
                            <span className="text-stone-200 select-none">_______</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note about physical register book maintenance */}
            <div className="mt-2 text-[10px] font-sans text-stone-500 flex items-center justify-between px-1">
              <span>* Standard 10-Year Scholar Register Academic Folio compliant with CBSE & State Education Board standards.</span>
              <span className="font-mono">S.R. Folio Ref: THPHS/SR/{data.srNumber}</span>
            </div>
          </div>

          {/* Bottom Section: Official Certification & Signatures */}
          <div className="mt-4 pt-3 border-t-2 border-[#0f2e60] font-sans">
            <p className="text-[11px] text-stone-700 font-serif italic text-center mb-6">
              "Certified that the above entries of academic progress, annual attendance, and promotion status are true, complete, and faithfully transcribed from the Official Class Tabulation & Examination Records of Town Hall Public High School."
            </p>

            <div className="grid grid-cols-4 gap-4 text-center text-xs font-semibold text-stone-800 pt-3">
              {/* Prepared by */}
              <div className="flex flex-col justify-end items-center">
                <div className="w-32 border-b border-stone-800 mb-1" />
                <span className="text-[11px] font-bold uppercase text-stone-700">Class Teacher</span>
                <span className="text-[9px] text-stone-500 font-normal">Signature & Date</span>
              </div>

              {/* Verified by */}
              <div className="flex flex-col justify-end items-center">
                <div className="w-32 border-b border-stone-800 mb-1" />
                <span className="text-[11px] font-bold uppercase text-stone-700">Exam In-Charge</span>
                <span className="text-[9px] text-stone-500 font-normal">Verification Officer</span>
              </div>

              {/* Institution Seal */}
              <div className="flex flex-col justify-end items-center">
                <div className="w-20 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[10px] text-stone-400 font-normal uppercase mb-1">
                  School Seal
                </div>
                <span className="text-[11px] font-bold uppercase text-stone-700">Institutional Seal</span>
              </div>

              {/* Principal */}
              <div className="flex flex-col justify-end items-center">
                <div className="w-32 border-b border-stone-800 mb-1" />
                <span className="text-[11px] font-black uppercase text-[#0f2e60]">Principal</span>
                <span className="text-[9px] text-stone-500 font-normal">Town Hall Public High School</span>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] font-mono text-stone-500">
              <div className="flex items-center gap-2">
                <span>Location: Lucknow, UP</span>
                {data.traceCode && (
                  <span className="font-bold bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300 text-stone-700">
                    TRACE: {data.traceCode}
                  </span>
                )}
              </div>

              {data.qrCodeDataUrl ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase font-bold text-stone-600">Scan to Verify 10-Yr Progression</span>
                  <img
                    src={data.qrCodeDataUrl}
                    alt="QR Code"
                    className="w-8 h-8 object-contain border border-stone-900 p-0.5 bg-white"
                  />
                </div>
              ) : (
                <span>Official S.R. Back Folio</span>
              )}

              <span>Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
