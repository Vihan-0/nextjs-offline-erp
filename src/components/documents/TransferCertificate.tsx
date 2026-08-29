import React from "react";

export interface TCAcademicRow {
  className: string; // "Nur-", "LKG", "UKG", "I", etc.
  dateOfAdmission?: string;
  result?: string;
  workAndConduct?: string;
}

export interface TransferCertificateData {
  // Identification
  serialNo?: string;
  admissionNo: string; // S.R. No
  penNo?: string;
  apparId?: string; // APAAR ID
  traceCode?: string;
  qrCodeDataUrl?: string;

  // Scholar Information
  studentName: string;
  dateOfBirthFormatted: string;
  religion?: string;
  caste?: string; // Category / Caste

  // Parent's Information
  fatherName: string;
  motherName: string;

  // Previous Institution & TC
  lastInstitutionName?: string;
  tcSubmitted?: "Submitt" | "Not Submitt" | boolean | string | null;
  sessionYear?: string;

  // Academic History Table (13 rows from Nur- to X)
  academicHistory?: Record<string, TCAcademicRow>;

  // Discharge & Dates
  dateOfRemoval?: string; // Date of Removel
  issueDateFormatted?: string;

  // School Information
  udiseCode?: string;
  schoolName?: string;
  schoolAddressLine1?: string;
  schoolAddressLine2?: string;
  schoolEmail?: string;
  schoolMobile?: string;
}

interface TransferCertificateProps {
  data: TransferCertificateData;
  className?: string;
}

// 13 Official Classes exactly matching the physical certificate
export const TC_CLASSES = [
  "Nur-",
  "LKG",
  "UKG",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];

export function TransferCertificate({
  data,
  className = "",
}: TransferCertificateProps) {
  const udiseCode = data.udiseCode || "09270916593";
  const schoolName = data.schoolName || "TOWN HALL PUBLIC HIGH SCHOOL";
  const addressLine1 =
    data.schoolAddressLine1 || "Ramapuram , New Tilak Nagar Rakabganj";
  const addressLine2 = data.schoolAddressLine2 || "Lucknow – 226004";
  const email = data.schoolEmail || "thps1996@gmail.com";
  const mobile = data.schoolMobile || "9235445596";

  const isSubmitted =
    data.tcSubmitted === "Submitt" ||
    data.tcSubmitted === true ||
    data.tcSubmitted === "true" ||
    data.tcSubmitted === "Submitted";

  const isNotSubmitted =
    data.tcSubmitted === "Not Submitt" ||
    data.tcSubmitted === false ||
    data.tcSubmitted === "false" ||
    data.tcSubmitted === "Not Submitted";

  return (
    <div
      className={`transfer-certificate-root bg-white text-stone-950 mx-auto select-none print:m-0 print:p-0 ${className}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm 14mm",
        boxSizing: "border-box",
        fontFamily: "'Calibri', 'Arial', 'Times New Roman', sans-serif",
        color: "#000000",
      }}
    >
      <div className="flex flex-col justify-between h-full space-y-3 relative text-[11px] leading-tight">
        
        {/* ========================================================= */}
        {/* 1. TOP HEADER SECTION                                     */}
        {/* ========================================================= */}
        <div className="relative pb-1">
          {/* Top Row: School Logo (Left), School Details (Center), Contact (Right) */}
          <div className="flex items-start justify-between">
            {/* Left: School Logo */}
            <div className="w-16 h-16 relative shrink-0 pt-0.5">
              <img
                src="/thphslogo.jpeg"
                alt="Town Hall Public High School Logo"
                className="w-14 h-14 object-contain block rounded-full border border-stone-300 shadow-2xs"
              />
            </div>

            {/* Center: UDISE & School Name */}
            <div className="text-center flex-1 px-2">
              <h3 className="text-[13px] font-black tracking-wider uppercase">
                UDISE CODE – {udiseCode}
              </h3>
              <h1 className="text-[19px] font-black tracking-wide uppercase mt-0.5 leading-tight font-serif">
                {schoolName}
              </h1>
              <p className="text-[11px] font-semibold mt-0.5">
                {addressLine1}
              </p>
              <p className="text-[11px] font-semibold">
                {addressLine2}
              </p>
            </div>

            {/* Right: Email & Phone */}
            <div className="text-right text-[10.5px] font-semibold shrink-0 pt-1 leading-normal">
              <p>{email}</p>
              <p>Mobile - {mobile}</p>
            </div>
          </div>

          {/* Document Title & Serial No. */}
          <div className="text-center mt-2.5">
            <h2 className="text-[17px] font-bold tracking-normal font-serif">
              Transfer Certificate
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11.5px]">
              <span className="font-bold">Serial No.</span>
              <span className="min-w-[170px] border-b border-dotted border-black inline-block font-mono font-bold text-stone-900 text-center px-2">
                {data.serialNo || data.traceCode || "...................................."}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. IDENTIFIERS ROW (Admission No, Pen No, Appar ID)        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-2 text-[11px] font-bold pt-1">
          {/* Admission No */}
          <div className="col-span-4 flex items-baseline gap-1">
            <span className="shrink-0">Admission No -</span>
            <span className="border-b border-dotted border-black flex-1 font-mono font-bold text-center px-1 truncate">
              {data.admissionNo || "........................"}
            </span>
          </div>

          {/* Pen No- */}
          <div className="col-span-4 flex items-baseline gap-1">
            <span className="shrink-0">Pen No-</span>
            <span className="border-b border-dotted border-black flex-1 font-mono font-bold text-center px-1 truncate">
              {data.penNo || "........................"}
            </span>
          </div>

          {/* Appar ID */}
          <div className="col-span-4 flex items-baseline gap-1">
            <span className="shrink-0">Appar ID</span>
            <span className="border-b border-dotted border-black flex-1 font-mono font-bold text-center px-1 truncate">
              {data.apparId || "........................"}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TWO-COLUMN SCHOLAR & PARENT'S INFORMATION              */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 gap-6 pt-1">
          {/* Left Column: Scholar Information */}
          <div className="space-y-2">
            <h4 className="font-black text-[12px] uppercase tracking-wide">
              Scholar Information
            </h4>

            {/* Name */}
            <div className="flex items-baseline gap-1 text-[11px]">
              <span className="font-bold shrink-0">Name -</span>
              <span className="border-b border-dotted border-black flex-1 font-bold uppercase px-1 truncate">
                {data.studentName || ".................................................."}
              </span>
            </div>

            {/* DOB */}
            <div className="flex items-baseline gap-1 text-[11px]">
              <span className="font-bold shrink-0">DOB -</span>
              <span className="border-b border-dotted border-black flex-1 font-mono font-bold px-1 truncate">
                {data.dateOfBirthFormatted || ".................................................."}
              </span>
            </div>

            {/* Religion & Caste */}
            <div className="flex items-baseline gap-2 text-[11px]">
              <div className="flex items-baseline gap-1 flex-1 min-w-0">
                <span className="font-bold shrink-0">Religion-</span>
                <span className="border-b border-dotted border-black flex-1 font-semibold px-1 truncate">
                  {data.religion || "...................."}
                </span>
              </div>
              <div className="flex items-baseline gap-1 flex-1 min-w-0">
                <span className="font-bold shrink-0">Caste -</span>
                <span className="border-b border-dotted border-black flex-1 font-semibold uppercase px-1 truncate">
                  {data.caste || "...................."}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Parent's Information */}
          <div className="space-y-2">
            <h4 className="font-black text-[12px] uppercase tracking-wide">
              Parent's Information
            </h4>

            {/* Father Name */}
            <div className="flex items-baseline gap-1 text-[11px]">
              <span className="font-bold shrink-0">Father Name -</span>
              <span className="border-b border-dotted border-black flex-1 font-bold uppercase px-1 truncate">
                {data.fatherName || ".................................................."}
              </span>
            </div>

            {/* Mother Name */}
            <div className="flex items-baseline gap-1 text-[11px]">
              <span className="font-bold shrink-0">Mother Name -</span>
              <span className="border-b border-dotted border-black flex-1 font-bold uppercase px-1 truncate">
                {data.motherName || ".................................................."}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. PREVIOUS INSTITUTION, T.C STATUS & SESSION ROW         */}
        {/* ========================================================= */}
        <div className="grid grid-cols-12 gap-3 items-end pt-2 pb-1 text-[11px]">
          {/* Left: Last Institution Name */}
          <div className="col-span-5 space-y-1">
            <span className="font-black block">Last Institution Name</span>
            <div className="border-b border-dotted border-black font-semibold text-[10.5px] truncate min-h-[18px] px-1">
              {data.lastInstitutionName || "................................................"}
            </div>
          </div>

          {/* Center: T.C (Submitt / Not Submitt) */}
          <div className="col-span-4 text-center space-y-1">
            <span className="font-black block">T.C</span>
            <div className="flex items-center justify-center gap-3 text-[10.5px] font-bold pt-0.5">
              <span className="flex items-center gap-1">
                <span>Submitt</span>
                <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-black text-xs">
                  {isSubmitted ? "✓" : ""}
                </span>
              </span>
              <span className="text-stone-400 font-normal">/</span>
              <span className="flex items-center gap-1">
                <span>Not Submitt</span>
                <span className="inline-block w-4 h-4 border border-black text-center leading-3 font-black text-xs">
                  {isNotSubmitted ? "✓" : ""}
                </span>
              </span>
            </div>
          </div>

          {/* Right: Session */}
          <div className="col-span-3 space-y-1 text-right">
            <span className="font-black block text-center">Session</span>
            <div className="border-b border-dotted border-black font-mono font-bold text-center text-[11px] truncate min-h-[18px] px-1">
              {data.sessionYear || "............................."}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. ACADEMIC RECORD HISTORY TABLE (13 Classes)             */}
        {/* ========================================================= */}
        <div className="border border-black overflow-hidden text-[10.5px]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black font-black text-center bg-stone-50">
                <th className="w-[12%] py-1 px-1.5 border-r border-black uppercase text-center">
                  Class
                </th>
                <th className="w-[28%] py-1 px-2 border-r border-black uppercase text-center">
                  Date of Admission
                </th>
                <th className="w-[28%] py-1 px-2 border-r border-black uppercase text-center">
                  Result
                </th>
                <th className="w-[32%] py-1 px-2 uppercase text-center">
                  Work & Conduct
                </th>
              </tr>
            </thead>
            <tbody>
              {TC_CLASSES.map((clsName) => {
                const row: Partial<TCAcademicRow> = data.academicHistory?.[clsName] || {};
                const dateOfAdm = row.dateOfAdmission || "";
                const result = row.result || "";
                const conduct = row.workAndConduct || "";

                return (
                  <tr
                    key={clsName}
                    className="border-b border-black last:border-b-0 h-[21px]"
                  >
                    {/* Class Name */}
                    <td className="py-0.5 px-1.5 font-bold border-r border-black text-center uppercase whitespace-nowrap">
                      {clsName}
                    </td>

                    {/* Date of Admission */}
                    <td className="py-0.5 px-2 border-r border-black font-mono text-center text-[10px]">
                      {dateOfAdm}
                    </td>

                    {/* Result */}
                    <td className="py-0.5 px-2 border-r border-black font-semibold text-center uppercase text-[10px]">
                      {result}
                    </td>

                    {/* Work & Conduct */}
                    <td className="py-0.5 px-2 font-semibold text-center uppercase text-[10px]">
                      {conduct}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ========================================================= */}
        {/* 6. BOTTOM FOOTER SECTION (Removal, Issue Date & Sign)     */}
        {/* ========================================================= */}
        <div className="pt-2">
          <div className="flex items-start justify-between gap-4">
            
            {/* Left Footer Block: Date of Removel & Parents Note */}
            <div className="space-y-1.5 text-[11px] flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold shrink-0">Date of Removel -</span>
                <span className="border-b border-dotted border-black min-w-[200px] font-mono font-bold px-1 inline-block">
                  {data.dateOfRemoval || "...................................."}
                </span>
              </div>

              <div className="text-[10.5px] font-bold text-stone-900 pt-0.5">
                Note – General Information given by the parents .
              </div>

              {/* Discreet Anti-Tamper Trace Code Badge */}
              {data.traceCode && (
                <div className="text-[8px] font-mono text-stone-500 pt-1 flex items-center gap-2">
                  <span>SEC-TRACE: {data.traceCode}</span>
                  <span>•</span>
                  <span>Town Hall ERP Offline Verified</span>
                </div>
              )}
            </div>

            {/* Right Footer Block: Issue Date & Principal Signature */}
            <div className="text-right space-y-8 shrink-0 min-w-[240px]">
              <div className="flex items-baseline justify-end gap-1.5 text-[11px]">
                <span className="font-bold shrink-0">Issue Date -</span>
                <span className="border-b border-dotted border-black min-w-[170px] font-mono font-bold text-center px-1 inline-block">
                  {data.issueDateFormatted || "...................................."}
                </span>
              </div>

              <div className="pt-4 text-center">
                <div className="w-48 border-t border-dotted border-transparent mx-auto"></div>
                <span className="font-black text-[12px] uppercase block tracking-wider font-serif">
                  Principal Signature
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
