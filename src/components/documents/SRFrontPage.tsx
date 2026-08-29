import React from "react";
import Image from "next/image";
import { getEnclosureUrl } from "@/lib/enclosures";

export interface SRFrontPageData {
  srNumber: string;
  admissionDateFormatted?: string;
  admissionClass?: string;
  sessionYear?: string;
  
  // Student Demographics
  studentName: string;
  dateOfBirthFormatted: string; // e.g. "15/08/2016"
  dateOfBirthWords?: string; // e.g. "Fifteenth August Two Thousand Sixteen"
  gender: string;
  bloodGroup?: string;
  religion?: string;
  category?: string;
  nationality?: string;
  distanceFromSchool?: number | string;
  photoPath?: string | null;

  // Parents / Guardians
  fatherName: string;
  fatherQualification?: string;
  fatherOccupation?: string;
  fatherIncome?: number | string;
  fatherPhone?: string;

  motherName: string;
  motherQualification?: string;
  motherOccupation?: string;
  motherPhone?: string;

  parentPanMasked?: string;
  parentPhotoPath?: string | null;

  residentialAddress: string;

  // Medical & Enclosures
  medicalConditions?: string;
  allergies?: string;
  enclosuresSubmitted: {
    photo: boolean;
    birthCertificate: boolean;
    aadharCard: boolean;
    transferCertificate: boolean;
    parentPhoto?: boolean;
  };

  // School Identity
  schoolName?: string;
  schoolTagline?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  affiliationNumber?: string;
  traceCode?: string;
  qrCodeDataUrl?: string;
}

interface SRFrontPageProps {
  data: SRFrontPageData;
  className?: string;
}

export function SRFrontPage({ data, className = "" }: SRFrontPageProps) {
  const schoolName = data.schoolName || "TOWN HALL PUBLIC HIGH SCHOOL";
  const schoolTagline = data.schoolTagline || "(A Tradition in Quality Education)";
  const schoolAddress = data.schoolAddress || "Kundari Rakabganj, Ramapuram, Lucknow";
  const schoolPhone = data.schoolPhone || "Mob. No.- 9235445596";

  return (
    <div
      className={`sr-front-page-container bg-white text-stone-900 mx-auto ${className}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "10mm 12mm",
        boxSizing: "border-box",
        fontFamily: "'Times New Roman', Times, Georgia, serif",
      }}
    >
      {/* Formal Double Border Ledger Frame */}
      <div
        className="h-full border-[3px] border-stone-900 p-2 flex flex-col justify-between"
        style={{ minHeight: "275mm" }}
      >
        <div className="border border-stone-900 p-4 space-y-3.5 flex-1 flex flex-col justify-between">
          
          {/* Header Block with Emblem & Official Title */}
          <div className="border-b-2 border-stone-900 pb-2.5">
            <div className="flex items-center justify-between gap-4">
              
              {/* Left: Official School Logo */}
              <div className="w-16 h-16 relative shrink-0">
                <img
                  src="/thphslogo.jpeg"
                  alt="School Emblem"
                  className="w-full h-full object-contain block"
                />
              </div>

              {/* Center: School Demographics & Ledger Title */}
              <div className="text-center flex-1">
                <h1 className="text-[20px] font-black tracking-wider uppercase text-stone-950 leading-none">
                  {schoolName}
                </h1>
                <p className="text-[9.5px] font-bold tracking-widest text-stone-700 uppercase mt-0.5">
                  {schoolTagline}
                </p>
                <p className="text-[9px] text-stone-600 mt-0.5 font-sans">
                  {schoolAddress}
                </p>
                <p className="text-[8.5px] text-stone-500 font-sans">
                  {schoolPhone}
                </p>

                <div className="mt-1.5 inline-block bg-stone-900 text-white px-5 py-0.5 rounded-sm">
                  <h2 className="text-[12px] font-black uppercase tracking-widest">
                    SCHOLAR REGISTER — FRONT FOLIO
                  </h2>
                </div>
              </div>

              {/* Right: Passport Photo Box */}
              <div className="w-20 h-24 border-2 border-stone-900 flex flex-col items-center justify-center shrink-0 bg-stone-50 overflow-hidden relative text-center">
                {data.photoPath ? (
                  <img
                    src={getEnclosureUrl(data.photoPath)}
                    alt={data.studentName}
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="p-1">
                    <span className="text-[8px] font-sans font-bold text-stone-400 uppercase leading-none block">
                      Affix Recent<br />Passport Size<br />Photograph
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Register Reference Line */}
            <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-stone-300 text-[10.5px]">
              <div className="flex items-baseline gap-1">
                <span className="font-bold uppercase text-stone-700">S.R. No.:</span>
                <span className="font-mono font-black text-stone-950 text-[12px] border-b border-dotted border-stone-900 flex-1 px-1">
                  {data.srNumber}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold uppercase text-stone-700">Admission Date:</span>
                <span className="font-semibold text-stone-900 border-b border-dotted border-stone-900 flex-1 px-1 text-center">
                  {data.admissionDateFormatted || "—"}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold uppercase text-stone-700">Class Admitted:</span>
                <span className="font-bold text-stone-950 border-b border-dotted border-stone-900 flex-1 px-1 text-center uppercase">
                  {data.admissionClass || "NURSERY"}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-bold uppercase text-stone-700">Session:</span>
                <span className="font-semibold text-stone-900 border-b border-dotted border-stone-900 flex-1 px-1 text-center">
                  {data.sessionYear || "2026-2027"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Scholar's Personal Demographics */}
          <div className="space-y-1.5">
            <div className="bg-stone-100 border border-stone-400 px-2 py-0.5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-900">
                Section I: Scholar's Personal Record
              </span>
              <span className="text-[8.5px] font-sans font-medium text-stone-600">
                (As per Official Proof of Birth)
              </span>
            </div>

            <table className="w-full border-collapse border border-stone-900 text-[10px]">
              <tbody>
                <tr>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase w-[22%]">
                    1. Scholar's Full Name
                  </td>
                  <td colSpan={3} className="border border-stone-900 px-2.5 py-1 font-black text-[12px] uppercase tracking-wide text-stone-950">
                    {data.studentName}
                  </td>
                </tr>

                <tr>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase">
                    2. Date of Birth
                  </td>
                  <td colSpan={3} className="border border-stone-900 px-2 py-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span>
                        <strong>(In Figures):</strong>{" "}
                        <span className="font-mono font-bold">{data.dateOfBirthFormatted}</span>
                      </span>
                      {data.dateOfBirthWords && (
                        <span className="italic text-stone-800 text-[9.5px]">
                          <strong>(In Words):</strong> {data.dateOfBirthWords}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase">
                    3. Gender & Blood Group
                  </td>
                  <td className="border border-stone-900 px-2 py-1 w-[28%] font-semibold">
                    <span className="capitalize">{data.gender}</span>
                    {data.bloodGroup ? <span className="uppercase">{` • Blood Group: ${data.bloodGroup}`}</span> : ""}
                  </td>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase w-[22%]">
                    4. Caste / Category
                  </td>
                  <td className="border border-stone-900 px-2 py-1 w-[28%] font-semibold capitalize">
                    {data.category || "General"}
                  </td>
                </tr>

                <tr>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase">
                    5. Religion & Nationality
                  </td>
                  <td className="border border-stone-900 px-2 py-1 font-semibold">
                    {data.religion ? <><span className="capitalize">{data.religion}</span> • </> : ""}
                    <span className="capitalize">{data.nationality || "Indian"}</span>
                  </td>
                  <td className="border border-stone-900 px-2 py-1 bg-stone-50 font-bold uppercase">
                    6. Distance from School
                  </td>
                  <td className="border border-stone-900 px-2 py-1 font-semibold">
                    {data.distanceFromSchool ? `${data.distanceFromSchool} KM` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Parent & Guardian Details */}
          <div className="space-y-1.5">
            <div className="bg-stone-100 border border-stone-400 px-2 py-0.5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-900">
                Section II: Parentage & Residential Record
              </span>
              <span className="text-[8.5px] font-sans font-medium text-stone-600">
                (With Identity & Photo Proof)
              </span>
            </div>

            <div className="flex gap-2 items-stretch">
              <table className="flex-1 border-collapse border border-stone-900 text-[10px]">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="border border-stone-900 px-2 py-0.5 text-left font-bold uppercase w-[24%]">
                      Particulars
                    </th>
                    <th className="border border-stone-900 px-2 py-0.5 text-left font-bold uppercase w-[38%]">
                      Father's Particulars
                    </th>
                    <th className="border border-stone-900 px-2 py-0.5 text-left font-bold uppercase w-[38%]">
                      Mother's Particulars
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Full Legal Name
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-bold uppercase text-stone-950">
                      {data.fatherName || "—"}
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-bold uppercase text-stone-950">
                      {data.motherName || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Qualification
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-semibold uppercase text-[9.5px]">
                      {data.fatherQualification || "—"}
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-semibold uppercase text-[9.5px]">
                      {data.motherQualification || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Occupation
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-semibold capitalize text-[9.5px]">
                      {data.fatherOccupation || "—"}
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-semibold capitalize text-[9.5px]">
                      {data.motherOccupation || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Phone / Mobile No.
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-mono font-bold text-[9.5px]">
                      {data.fatherPhone || "—"}
                    </td>
                    <td className="border border-stone-900 px-2 py-0.5 font-mono font-bold text-[9.5px]">
                      {data.motherPhone || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Parent PAN (Masked)
                    </td>
                    <td colSpan={2} className="border border-stone-900 px-2 py-0.5 font-mono font-bold text-[10px] text-stone-950">
                      {data.parentPanMasked || "—"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Annual Income
                    </td>
                    <td colSpan={2} className="border border-stone-900 px-2 py-0.5 font-semibold capitalize text-[9.5px]">
                      {data.fatherIncome ? `₹ ${Number(data.fatherIncome).toLocaleString("en-IN")} per annum` : "Not Specified"}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-stone-900 px-2 py-0.5 bg-stone-50 font-bold uppercase">
                      Permanent Address
                    </td>
                    <td colSpan={2} className="border border-stone-900 px-2 py-0.5 font-bold uppercase leading-tight text-[9.5px]">
                      {data.residentialAddress || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right: Parent / Guardian Photograph Slot */}
              <div className="w-20 border-2 border-stone-900 flex flex-col items-center justify-center shrink-0 bg-stone-50 overflow-hidden text-center relative">
                {data.parentPhotoPath ? (
                  <img
                    src={getEnclosureUrl(data.parentPhotoPath)}
                    alt="Parent / Guardian"
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="p-1">
                    <span className="text-[7.5px] font-sans font-bold text-stone-400 uppercase leading-tight block">
                      Affix Recent<br />Parent / Guardian<br />Photograph
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Health & Enclosures Verified */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {/* Left: Medical History */}
            <div className="border border-stone-900 p-2 space-y-1 bg-stone-50/50">
              <h4 className="font-bold uppercase text-[9.5px] border-b border-stone-300 pb-0.5 text-stone-800">
                Medical & Health Record
              </h4>
              <div className="space-y-0.5 text-[9px]">
                <p>
                  <strong>Specific Conditions:</strong>{" "}
                  <span className="capitalize">{data.medicalConditions || "None Reported / Medically Fit"}</span>
                </p>
                <p>
                  <strong>Allergies / Special Care:</strong>{" "}
                  <span className="capitalize">{data.allergies || "None on Record"}</span>
                </p>
              </div>
            </div>

            {/* Right: Enclosures Checklist */}
            <div className="border border-stone-900 p-2 space-y-1 bg-stone-50/50">
              <h4 className="font-bold uppercase text-[9.5px] border-b border-stone-300 pb-0.5 text-stone-800">
                Enclosures & Proofs Submitted
              </h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold">{data.enclosuresSubmitted.photo ? "☑" : "☐"}</span>
                  <span>1. Student Photo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{data.enclosuresSubmitted.parentPhoto ? "☑" : "☐"}</span>
                  <span>2. Parent Photo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{data.enclosuresSubmitted.birthCertificate ? "☑" : "☐"}</span>
                  <span>3. Birth Certificate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{data.enclosuresSubmitted.aadharCard ? "☑" : "☐"}</span>
                  <span>4. Aadhar Card</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <span className="font-bold">{data.enclosuresSubmitted.transferCertificate ? "☑" : "☐"}</span>
                  <span>5. Transfer Certificate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Declaration & Verification Endorsements */}
          <div className="space-y-2 pt-1 border-t border-stone-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 space-y-0.5">
                <p className="text-[8px] leading-tight text-stone-700 italic text-justify">
                  <strong>Official Declaration:</strong> I hereby declare that the particulars furnished above regarding the scholar are true and correct to the best of my knowledge and belief. No alteration in the date of birth or demographic records shall be claimed subsequently.
                </p>
                {data.traceCode && (
                  <div className="text-[7.5px] font-mono text-stone-700 font-bold">
                    SECURITY TRACE: {data.traceCode} • Scan QR to verify master register ledger
                  </div>
                )}
              </div>

              {data.qrCodeDataUrl && (
                <div className="shrink-0 flex flex-col items-center bg-white p-0.5 border border-stone-900 rounded">
                  <img
                    src={data.qrCodeDataUrl}
                    alt="Security QR"
                    className="w-10 h-10 object-contain block"
                  />
                  <span className="text-[5.5px] font-mono font-bold text-stone-900">
                    VERIFY
                  </span>
                </div>
              )}
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-4 gap-2 pt-4 text-center text-[9px]">
              <div className="border-t border-stone-900 pt-1">
                <span className="font-bold uppercase block text-stone-900">
                  Signature of Parent / Guardian
                </span>
                <span className="text-[7.5px] text-stone-500 block mt-0.5">Date: ____________</span>
              </div>

              <div className="border-t border-stone-900 pt-1">
                <span className="font-bold uppercase block text-stone-900">
                  Class Teacher
                </span>
                <span className="text-[7.5px] text-stone-500 block mt-0.5">Verified By</span>
              </div>

              <div className="border-t border-stone-900 pt-1">
                <span className="font-bold uppercase block text-stone-900">
                  Admission In-Charge
                </span>
                <span className="text-[7.5px] text-stone-500 block mt-0.5">Checked & Entered</span>
              </div>

              <div className="border-t border-stone-900 pt-1">
                <span className="font-bold uppercase block text-stone-900">
                  Principal / Headmaster
                </span>
                <span className="text-[7.5px] text-stone-500 block mt-0.5">Town Hall Public High School</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
