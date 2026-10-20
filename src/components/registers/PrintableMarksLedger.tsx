import React from "react";
import { RawStudentData } from "./AccumulativeRegisterGrid";
import { convertScoreOrGradeToLetterGrade } from "@/lib/classHierarchy";

interface PrintableMarksLedgerProps {
  selectedClass: string;
  selectedSessionYear: string;
  selectedTerm: string;
  activeFormat: string;
  students: RawStudentData[];
  gridData: Record<string, any>;
}

export function PrintableMarksLedger({
  selectedClass,
  selectedSessionYear,
  selectedTerm,
  activeFormat,
  students,
  gridData,
}: PrintableMarksLedgerProps) {
  // Format B Subject List
  const formatBSubjects = [
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
  ];

  // Format C Subject List
  const formatCSubjects = [
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
  ];

  // Format A Subject List matching AccumulativeRegisterGrid keys
  const formatASubjects = [
    { key: "English - Literature", label: "Eng Lit" },
    { key: "English - Language", label: "Eng Lang" },
    { key: "English - Writing / Dictation", label: "Eng Dict" },
    { key: "English - Reading / Recitation", label: "Eng Read" },
    { key: "Hindi - Literature", label: "Hin Lit" },
    { key: "Hindi - Language", label: "Hin Lang" },
    { key: "Hindi - Writing / Dictation", label: "Hin Dict" },
    { key: "Hindi - Reading / Recitation", label: "Hin Read" },
    { key: "Mathematics - Logic and calculation", label: "Math Logic" },
    { key: "Mathematics - Mental ability", label: "Math Mental" },
    { key: "Mathematics - Oral", label: "Math Oral" },
    { key: "Environmental Education - Written", label: "EVS Written" },
    { key: "Environmental Education - Oral", label: "EVS Oral" },
    { key: "General Awareness - Written", label: "GK Written" },
    { key: "General Awareness - Oral", label: "GK Oral" },
    { key: "Computer - Theory/Practical", label: "Computer" },
    { key: "Art & Craft", label: "Art/Craft" },
    { key: "PT/Game", label: "P.T." },
  ];

  const computeTotalsForBOrC = (stData: any, subjects: string[]) => {
    let totalObtained = 0;
    let subjectCount = 0;

    subjects.forEach((subj) => {
      const key = `${subj}__${selectedTerm}`;
      const markObj = stData?.marks?.[key];
      const val = markObj?.total ?? markObj?.written ?? "";
      const num = parseFloat(val);
      if (!isNaN(num)) {
        totalObtained += num;
        subjectCount++;
      }
    });

    const maxTotal = subjects.length * 100;
    const percentage = subjects.length > 0 ? ((totalObtained / maxTotal) * 100).toFixed(1) : "0.0";
    
    // Grade calculation
    const pct = parseFloat(percentage);
    let grade = "E";
    if (pct >= 90) grade = "A1";
    else if (pct >= 80) grade = "A2";
    else if (pct >= 70) grade = "B1";
    else if (pct >= 60) grade = "B2";
    else if (pct >= 50) grade = "C1";
    else if (pct >= 40) grade = "C2";
    else if (pct >= 33) grade = "D";

    return { totalObtained, maxTotal, percentage, grade };
  };

  const computeTotalsForA = (stData: any) => {
    let totalObtained = 0;
    let counted = 0;

    formatASubjects.forEach((sub) => {
      const markKey = `${sub.key}__${selectedTerm}`;
      const mObj = stData?.marks?.[markKey];
      const val = mObj?.total ?? mObj?.written ?? "";
      const num = parseFloat(val);
      if (!isNaN(num)) {
        totalObtained += num;
        counted++;
      }
    });

    const maxTotal = counted * 100;
    const percentage = maxTotal > 0 ? ((totalObtained / maxTotal) * 100).toFixed(1) : "—";
    const grade = percentage !== "—" ? convertScoreOrGradeToLetterGrade(percentage) : "—";

    return { totalObtained, maxTotal, percentage, grade, counted };
  };

  return (
    <div className="w-[297mm] min-h-[210mm] bg-white text-stone-950 font-sans p-6 mx-auto leading-tight print:w-full print:p-2 print:m-0 print:shadow-none text-[10px]">
      
      {/* 1. Official Header */}
      <div className="border-b-2 border-stone-900 pb-2 mb-3 flex items-center justify-between gap-4">
        <div className="w-14 h-14 shrink-0 border border-stone-300 rounded p-1">
          <img
            src="/thphslogo.jpeg"
            alt="Town Hall Public High School"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center flex-1">
          <h1 className="text-lg font-black uppercase tracking-wider text-stone-950 font-serif leading-none">
            TOWN HALL PUBLIC HIGH SCHOOL
          </h1>
          <p className="text-[10px] italic font-serif text-stone-700">
            “A Tradition in Quality Education” • Kundari Rakabganj, Ramapuram, Lucknow - 226004
          </p>
          <div className="inline-block mt-1 bg-stone-900 text-white px-4 py-0.5 rounded-xs">
            <h2 className="text-[11px] font-bold uppercase tracking-widest font-sans">
              ACCUMULATIVE MARKS REGISTER — FORMAT {activeFormat}
            </h2>
          </div>
        </div>

        <div className="text-right text-[10px] font-mono shrink-0 space-y-0.5 border-l border-stone-300 pl-3">
          <div><strong>Class:</strong> {selectedClass}</div>
          <div><strong>Session:</strong> {selectedSessionYear}</div>
          <div><strong>Exam / Term:</strong> {selectedTerm}</div>
          <div><strong>Scholars:</strong> {students.length}</div>
        </div>
      </div>

      {/* 2. Format B Table */}
      {activeFormat === "B" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-stone-900 text-[9.5px]">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-900">
                <th className="border border-stone-800 p-1 w-8 text-center">S.R. No</th>
                <th className="border border-stone-800 p-1 w-6 text-center">Roll</th>
                <th className="border border-stone-800 p-1 text-left min-w-[120px]">Scholar Name</th>
                {formatBSubjects.map((sub, idx) => (
                  <th key={sub} className="border border-stone-800 p-1 text-center font-semibold">
                    ({idx + 1}) {sub}
                  </th>
                ))}
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">Grand Total</th>
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">%</th>
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">Grade</th>
                <th className="border border-stone-800 p-1 text-center">Meetings</th>
                <th className="border border-stone-800 p-1 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-4 text-center text-stone-500 italic">
                    No enrolled scholars found for this class and session.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const stData = gridData[st.srNumber] || {};
                  const { totalObtained, percentage, grade } = computeTotalsForBOrC(stData, formatBSubjects);

                  return (
                    <tr key={st.srNumber} className="border-b border-stone-700 hover:bg-stone-50">
                      <td className="border border-stone-800 p-1 font-mono font-bold text-center">
                        {st.srNumber}
                      </td>
                      <td className="border border-stone-800 p-1 font-mono text-center">
                        {stData.rollNumber || "—"}
                      </td>
                      <td className="border border-stone-800 p-1 font-bold">
                        {stData.fullName || `${st.firstName} ${st.lastName}`}
                      </td>
                      {formatBSubjects.map((sub) => {
                        const markKey = `${sub}__${selectedTerm}`;
                        const mObj = stData?.marks?.[markKey];
                        const markVal = mObj?.total ?? mObj?.written ?? "—";
                        return (
                          <td key={sub} className="border border-stone-800 p-1 text-center font-mono">
                            {markVal}
                          </td>
                        );
                      })}
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {totalObtained}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {percentage}%
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold bg-stone-50">
                        {grade}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono">
                        {stData.attendancePresent || "—"} / {stData.attendanceTotal || "200"}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold">
                        {stData.resultStatus || "Promoted"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Format C Table */}
      {activeFormat === "C" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-stone-900 text-[9px]">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-900">
                <th className="border border-stone-800 p-1 w-8 text-center">S.R. No</th>
                <th className="border border-stone-800 p-1 w-6 text-center">Roll</th>
                <th className="border border-stone-800 p-1 text-left min-w-[110px]">Scholar Name</th>
                {formatCSubjects.map((sub, idx) => (
                  <th key={sub} className="border border-stone-800 p-1 text-center font-semibold">
                    ({idx + 1}) {sub}
                  </th>
                ))}
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">Total</th>
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">%</th>
                <th className="border border-stone-800 p-1 text-center font-bold bg-stone-200">Grade</th>
                <th className="border border-stone-800 p-1 text-center">Meetings</th>
                <th className="border border-stone-800 p-1 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={21} className="p-4 text-center text-stone-500 italic">
                    No enrolled scholars found for this class and session.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const stData = gridData[st.srNumber] || {};
                  const { totalObtained, percentage, grade } = computeTotalsForBOrC(stData, formatCSubjects);

                  return (
                    <tr key={st.srNumber} className="border-b border-stone-700 hover:bg-stone-50">
                      <td className="border border-stone-800 p-1 font-mono font-bold text-center">
                        {st.srNumber}
                      </td>
                      <td className="border border-stone-800 p-1 font-mono text-center">
                        {stData.rollNumber || "—"}
                      </td>
                      <td className="border border-stone-800 p-1 font-bold">
                        {stData.fullName || `${st.firstName} ${st.lastName}`}
                      </td>
                      {formatCSubjects.map((sub) => {
                        const markKey = `${sub}__${selectedTerm}`;
                        const mObj = stData?.marks?.[markKey];
                        const markVal = mObj?.total ?? mObj?.written ?? "—";
                        return (
                          <td key={sub} className="border border-stone-800 p-1 text-center font-mono">
                            {markVal}
                          </td>
                        );
                      })}
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {totalObtained}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {percentage}%
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold bg-stone-50">
                        {grade}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono">
                        {stData.attendancePresent || "—"} / {stData.attendanceTotal || "200"}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold">
                        {stData.resultStatus || "Promoted"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Format A Table */}
      {activeFormat === "A" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-stone-900 text-[9px]">
            <thead>
              <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-900">
                <th className="border border-stone-800 p-1 w-8 text-center">S.R. No</th>
                <th className="border border-stone-800 p-1 w-6 text-center">Roll</th>
                <th className="border border-stone-800 p-1 text-left min-w-[110px]">Scholar Name</th>
                {formatASubjects.map((sub, idx) => (
                  <th key={sub.key} className="border border-stone-800 p-1 text-center font-semibold text-[8px] whitespace-nowrap">
                    ({idx + 1}) {sub.label}
                  </th>
                ))}
                <th className="border border-stone-800 p-1 text-center bg-stone-200">Total</th>
                <th className="border border-stone-800 p-1 text-center bg-stone-200">%</th>
                <th className="border border-stone-800 p-1 text-center bg-stone-200">Grade</th>
                <th className="border border-stone-800 p-1 text-center">Meetings</th>
                <th className="border border-stone-800 p-1 text-center">Blood/Ht/Wt</th>
                <th className="border border-stone-800 p-1 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={24} className="p-4 text-center text-stone-500 italic">
                    No enrolled scholars found for this class and session.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const stData = gridData[st.srNumber] || {};
                  const { totalObtained, percentage, grade, counted } = computeTotalsForA(stData);

                  return (
                    <tr key={st.srNumber} className="border-b border-stone-700 hover:bg-stone-50">
                      <td className="border border-stone-800 p-1 font-mono font-bold text-center">
                        {st.srNumber}
                      </td>
                      <td className="border border-stone-800 p-1 font-mono text-center">
                        {stData.rollNumber || "—"}
                      </td>
                      <td className="border border-stone-800 p-1 font-bold">
                        {stData.fullName || `${st.firstName} ${st.lastName}`}
                      </td>
                      {formatASubjects.map((sub) => {
                        const markKey = `${sub.key}__${selectedTerm}`;
                        const mObj = stData?.marks?.[markKey];
                        const markVal = mObj?.total ?? mObj?.grade ?? mObj?.written ?? "—";
                        return (
                          <td key={sub.key} className="border border-stone-800 p-1 text-center font-mono">
                            {markVal}
                          </td>
                        );
                      })}
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {counted > 0 ? totalObtained : "—"}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono font-bold bg-stone-50">
                        {percentage !== "—" ? `${percentage}%` : "—"}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold bg-stone-50 text-emerald-800">
                        {grade}
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-mono">
                        {stData.attendancePresent || "—"} / {stData.attendanceTotal || "200"}
                      </td>
                      <td className="border border-stone-800 p-1 text-center text-[8.5px]">
                        {stData.bloodGroup || "—"} / {stData.height || "—"}cm / {stData.weight || "—"}kg
                      </td>
                      <td className="border border-stone-800 p-1 text-center font-bold">
                        {stData.resultStatus || "Promoted"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Institutional Signatures Block */}
      <div className="mt-8 pt-6 border-t-2 border-stone-800 grid grid-cols-3 gap-8 text-center text-[10px] font-sans">
        <div>
          <div className="border-t border-stone-800 pt-1.5 font-bold uppercase tracking-wider">
            Class Teacher Signature
          </div>
          <span className="text-[9px] text-stone-500">Verified Marks Entries</span>
        </div>
        <div>
          <div className="border-t border-stone-800 pt-1.5 font-bold uppercase tracking-wider">
            Examination Controller / In-Charge
          </div>
          <span className="text-[9px] text-stone-500">Tabulated & Cross-Checked</span>
        </div>
        <div>
          <div className="border-t border-stone-800 pt-1.5 font-bold uppercase tracking-wider">
            Principal / Director Signature
          </div>
          <span className="text-[9px] text-stone-500">Official Institutional Seal</span>
        </div>
      </div>

    </div>
  );
}
