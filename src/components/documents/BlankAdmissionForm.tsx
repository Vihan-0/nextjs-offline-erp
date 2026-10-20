import React from "react";

export interface PrintableAdmissionFormData {
  srNumber?: string;
  studentName?: string;
  dateOfBirth?: string;
  dateOfBirthWords?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  aadharNumber?: string;
  penNumber?: string;
  apaarId?: string;
  admissionClass?: string;
  admissionSession?: string;
  admissionDate?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherEducation?: string;
  fatherPhone?: string;
  fatherIncome?: string;
  fatherAadhar?: string;
  motherName?: string;
  motherOccupation?: string;
  motherEducation?: string;
  motherPhone?: string;
  motherIncome?: string;
  motherAadhar?: string;
  parentPan?: string;
  currentAddress?: string;
  permanentAddress?: string;
  photoUrl?: string | null;
  medicalConditions?: string;
  allergies?: string;
}

interface BlankAdmissionFormProps {
  student?: PrintableAdmissionFormData;
}

export function BlankAdmissionForm({ student }: BlankAdmissionFormProps) {
  const isFilled = Boolean(student);
  const nameChars = (student?.studentName || "").toUpperCase().slice(0, 26).split("");

  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-stone-900 p-8 font-serif text-[11px] leading-tight space-y-3 print:p-5 print:m-0 print:w-full print:shadow-none shadow-xl border border-stone-300">
      
      {/* 1. Header with Logo, School Name and Emblem */}
      <div className="border-b-2 border-stone-900 pb-2.5 flex items-center justify-between gap-4">
        <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-stone-300 rounded p-1">
          <img
            src="/thphslogo.jpeg"
            alt="Town Hall Public High School Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center flex-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-stone-950 font-sans">
            TOWN HALL PUBLIC HIGH SCHOOL
          </h1>
          <p className="text-[10px] italic font-serif text-stone-700">
            “A Tradition in Quality Education”
          </p>
          <p className="text-[9px] font-sans text-stone-600 mt-0.5">
            Kundari Rakabganj, Ramapuram, Lucknow - 226004 • Ph: 9235445596
          </p>
          <div className="inline-block mt-1 bg-stone-900 text-white px-4 py-0.5 rounded-xs">
            <h2 className="text-[10.5px] font-bold uppercase tracking-widest font-sans">
              STUDENT ADMISSION FORM &amp; SCHOLAR REGISTER ENTRY
            </h2>
          </div>
        </div>

        {/* Passport Photo Box */}
        <div className="w-22 h-26 border-2 border-dashed border-stone-800 flex flex-col items-center justify-center text-center p-1 bg-stone-50 shrink-0 overflow-hidden">
          {student?.photoUrl ? (
            <img
              src={student.photoUrl}
              alt="Scholar Photo"
              className="w-full h-full object-cover rounded-xs"
            />
          ) : (
            <span className="text-[8px] font-sans font-bold text-stone-500 uppercase leading-snug">
              Affix Recent<br />Passport Size<br />Color Photograph<br />(Self-Attested)
            </span>
          )}
        </div>
      </div>

      {/* Official Top Reference Strip */}
      <div className="grid grid-cols-4 gap-2 bg-stone-100 p-2 rounded border border-stone-300 text-[10px] font-sans">
        <div>
          <span className="font-bold text-stone-700">Academic Session:</span>{" "}
          <span className="font-mono font-bold text-stone-900">
            {student?.admissionSession || "2026 - 2027"}
          </span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Admission No. (S.R.):</span>{" "}
          <span className="font-mono font-bold text-stone-900">
            {student?.srNumber || "_______________"}
          </span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Class Sought:</span>{" "}
          <span className="font-bold text-stone-900">
            {student?.admissionClass || "_______________"}
          </span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Date of Admission:</span>{" "}
          <span className="font-bold text-stone-900 font-mono">
            {student?.admissionDate || "____/____/20___"}
          </span>
        </div>
      </div>

      {/* Section 1: Student Particulars */}
      <div className="border border-stone-800 rounded-sm">
        <div className="bg-stone-800 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-sans">
          1. Scholar Personal Information (Fill in Capital Letters)
        </div>
        <div className="p-2.5 space-y-2 text-[10.5px]">
          <div>
            <span className="font-bold">Student's Full Name:</span>
            {isFilled && student?.studentName ? (
              <div className="mt-1 flex gap-1 font-mono text-center">
                {Array.from({ length: 26 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 border border-stone-400 bg-stone-50/50 flex items-center justify-center text-[10px] font-bold text-stone-900"
                  >
                    {nameChars[i] || ""}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1 flex gap-1 font-mono text-center">
                {Array.from({ length: 26 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 border border-stone-400 bg-stone-50/50 flex items-center justify-center text-[10px]"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-0.5">
            <div>
              <span className="font-bold">Date of Birth (in figures):</span>{" "}
              <span className="border-b border-dotted border-stone-900 inline-block w-28 text-center font-mono font-bold">
                {student?.dateOfBirth || "DD / MM / YYYY"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-bold">Date of Birth (in words):</span>{" "}
              <span className="border-b border-dotted border-stone-900 inline-block min-w-64 font-semibold">
                {student?.dateOfBirthWords || ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-0.5">
            <div>
              <span className="font-bold">Gender:</span>{" "}
              {student?.gender ? (
                <span className="font-bold uppercase text-stone-950 font-sans">{student.gender}</span>
              ) : (
                "[ &nbsp; ] Boy &nbsp; [ &nbsp; ] Girl"
              )}
            </div>
            <div>
              <span className="font-bold">Blood Group:</span>{" "}
              <span className="font-bold">{student?.bloodGroup || "____________"}</span>
            </div>
            <div>
              <span className="font-bold">Nationality:</span>{" "}
              <span className="font-bold">{student?.nationality || "Indian"}</span>
            </div>
            <div>
              <span className="font-bold">Religion:</span>{" "}
              <span className="font-bold">{student?.religion || "____________"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div>
              <span className="font-bold">Category:</span>{" "}
              {student?.category ? (
                <span className="font-bold uppercase text-stone-950">{student.category}</span>
              ) : (
                "[ ] Gen &nbsp; [ ] SC &nbsp; [ ] ST &nbsp; [ ] OBC"
              )}
            </div>
            <div>
              <span className="font-bold">Student Aadhaar No.:</span>{" "}
              <span className="font-mono font-bold">{student?.aadharNumber || "____ - ____ - ____"}</span>
            </div>
            <div>
              <span className="font-bold">PEN No. (11 Digits):</span>{" "}
              <span className="font-mono font-bold">{student?.penNumber || "_______________"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <span className="font-bold">APAAR ID (12 Digits):</span>{" "}
              <span className="font-mono font-bold">{student?.apaarId || "________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Previous School Attended:</span>{" "}
              <span className="border-b border-dotted border-stone-900 inline-block w-48"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Parental & Family Details */}
      <div className="border border-stone-800 rounded-sm">
        <div className="bg-stone-800 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-sans">
          2. Parent / Guardian Particulars
        </div>
        <div className="p-2.5 space-y-1.5 text-[10.5px]">
          {/* Father Details */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <span className="font-bold">Father's Full Name:</span>{" "}
              <span className="font-bold uppercase">{student?.fatherName || "___________________________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Qualification:</span>{" "}
              <span>{student?.fatherEducation || "___________________"}</span>
            </div>
            <div>
              <span className="font-bold">Occupation:</span>{" "}
              <span>{student?.fatherOccupation || "___________________"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-bold">Father's Mobile No.:</span>{" "}
              <span className="font-mono font-bold">{student?.fatherPhone || "______________________"}</span>
            </div>
            <div>
              <span className="font-bold">Father's Aadhaar:</span>{" "}
              <span className="font-mono font-bold">{student?.fatherAadhar || "____ - ____ - ____"}</span>
            </div>
            <div>
              <span className="font-bold">Annual Income (₹):</span>{" "}
              <span className="font-bold">{student?.fatherIncome ? `₹ ${student.fatherIncome}` : "______________________"}</span>
            </div>
          </div>

          {/* Mother Details */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-stone-200">
            <div className="col-span-2">
              <span className="font-bold">Mother's Full Name:</span>{" "}
              <span className="font-bold uppercase">{student?.motherName || "___________________________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Qualification:</span>{" "}
              <span>{student?.motherEducation || "___________________"}</span>
            </div>
            <div>
              <span className="font-bold">Occupation:</span>{" "}
              <span>{student?.motherOccupation || "___________________"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-bold">Mother's Mobile:</span>{" "}
              <span className="font-mono font-bold">{student?.motherPhone || "___________________"}</span>
            </div>
            <div>
              <span className="font-bold">Mother's Aadhaar:</span>{" "}
              <span className="font-mono font-bold">{student?.motherAadhar || "____ - ____ - ____"}</span>
            </div>
            <div>
              <span className="font-bold">Mother's Income (₹):</span>{" "}
              <span className="font-bold">{student?.motherIncome ? `₹ ${student.motherIncome}` : "___________________"}</span>
            </div>
          </div>

          {/* PAN & Address Details */}
          <div className="pt-1 border-t border-stone-200 space-y-1">
            <div className="flex items-center gap-6">
              <div>
                <span className="font-bold">Parent PAN No.:</span>{" "}
                <span className="font-mono font-bold">{student?.parentPan || "______________________"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-0.5">
              <div>
                <span className="font-bold">Current Address:</span><br />
                {student?.currentAddress ? (
                  <p className="font-semibold text-stone-900 uppercase pt-0.5 text-[10px] leading-tight">
                    {student.currentAddress}
                  </p>
                ) : (
                  <>
                    <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                    <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                  </>
                )}
              </div>
              <div>
                <span className="font-bold">Permanent Address:</span><br />
                {student?.permanentAddress ? (
                  <p className="font-semibold text-stone-900 uppercase pt-0.5 text-[10px] leading-tight">
                    {student.permanentAddress}
                  </p>
                ) : (
                  <>
                    <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                    <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Medical Information & Enclosures */}
      <div className="grid grid-cols-2 gap-3">
        {/* Medical info */}
        <div className="border border-stone-800 rounded-sm p-2 space-y-1 text-[10px]">
          <div className="font-bold font-sans uppercase text-stone-900 border-b border-stone-300 pb-0.5">
            3. Medical &amp; Emergency Info
          </div>
          <div>
            <span className="font-bold">Medical Conditions:</span>{" "}
            <span>{student?.medicalConditions || "None Reported (Normal)"}</span>
          </div>
          <div>
            <span className="font-bold">Known Allergies:</span>{" "}
            <span>{student?.allergies || "None"}</span>
          </div>
          <div>
            <span className="font-bold">Emergency Contact:</span>{" "}
            <span className="font-mono font-bold">{student?.fatherPhone || student?.motherPhone || "___________________"}</span>
          </div>
        </div>

        {/* Enclosures checklist */}
        <div className="border border-stone-800 rounded-sm p-2 space-y-1 text-[9.5px]">
          <div className="font-bold font-sans uppercase text-stone-900 border-b border-stone-300 pb-0.5">
            4. Enclosures Checklist (Self-Attested)
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>[✓] 1. Birth Certificate</div>
            <div>[✓] 2. Aadhaar Card (Student)</div>
            <div>[✓] 3. Transfer Certificate (T.C.)</div>
            <div>[✓] 4. Previous Marksheet</div>
            <div>[✓] 5. Parent Aadhaar &amp; PAN</div>
            <div>[✓] 6. Passport Photos</div>
          </div>
        </div>
      </div>

      {/* Section 5: Parent / Guardian Declaration */}
      <div className="border border-stone-800 rounded-sm p-2 bg-stone-50/50 space-y-1.5 text-[9px]">
        <div className="font-bold font-sans uppercase text-stone-900">
          5. Declaration by Parent / Guardian
        </div>
        <p className="leading-tight text-stone-700 italic">
          “I hereby solemnly declare that the information provided above is true and correct to the best of my knowledge.
          I agree to abide by all the rules, code of conduct, and fee schedules of Town Hall Public High School. I understand that
          the Date of Birth entered above cannot be altered at any future date as per education board regulations.”
        </p>
        <div className="grid grid-cols-3 gap-4 pt-2 text-center text-[9.5px] font-sans">
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Signature of Father</div>
          </div>
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Signature of Mother</div>
          </div>
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Date &amp; Place</div>
          </div>
        </div>
      </div>

      {/* Section 6: For Office Use Only */}
      <div className="border-2 border-stone-900 rounded-sm p-2 bg-stone-100 text-[10px] font-sans space-y-1.5">
        <div className="font-bold uppercase tracking-wider text-stone-950 border-b border-stone-400 pb-0.5 flex justify-between items-center">
          <span>6. For Official Administrative Use Only</span>
          <span className="text-[9px] font-normal italic text-stone-600">Town Hall Admission Registry</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[9.5px]">
          <div>
            <span className="font-bold">S.R. No. Allotted:</span>{" "}
            <span className="font-mono font-bold">{student?.srNumber || "____________"}</span>
          </div>
          <div>
            <span className="font-bold">Class Admitted:</span>{" "}
            <span className="font-bold">{student?.admissionClass || "____________"}</span>
          </div>
          <div>
            <span className="font-bold">Session:</span>{" "}
            <span className="font-mono font-bold">{student?.admissionSession || "2026-2027"}</span>
          </div>
          <div>
            <span className="font-bold">Status:</span>{" "}
            <span className="font-bold text-emerald-700">VERIFIED / ACTIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 pt-2 text-center text-[9.5px]">
          <div>
            <div className="border-t border-stone-700 pt-1 font-bold">Admission In-Charge Signature</div>
          </div>
          <div>
            <div className="border-t border-stone-700 pt-1 font-bold">Principal / Headmaster (Official Seal)</div>
          </div>
        </div>
      </div>

    </div>
  );
}
