import React from "react";

export function BlankAdmissionForm() {
  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-stone-900 p-8 font-serif text-[11px] leading-tight space-y-3.5 print:p-6 print:m-0 print:w-full print:shadow-none shadow-xl border border-stone-300">
      
      {/* 1. Header with Logo, School Name and Emblem */}
      <div className="border-b-2 border-stone-900 pb-3 flex items-center justify-between gap-4">
        <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-stone-300 rounded p-1">
          <img
            src="/thphslogo.jpeg"
            alt="Town Hall Public High School Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center flex-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-stone-950">
            TOWN HALL PUBLIC HIGH SCHOOL
          </h1>
          <p className="text-[10px] italic font-serif text-stone-700">
            “A Tradition in Quality Education”
          </p>
          <p className="text-[9.5px] font-sans text-stone-600 mt-0.5">
            Kundari Rakabganj, Ramapuram, Lucknow - 226004 • Ph: 9235445596
          </p>
          <div className="inline-block mt-1 bg-stone-900 text-white px-4 py-0.5 rounded-xs">
            <h2 className="text-[11px] font-bold uppercase tracking-widest font-sans">
              STUDENT ADMISSION FORM & SCHOLAR REGISTER ENTRY
            </h2>
          </div>
        </div>

        {/* Passport Photo Box */}
        <div className="w-22 h-26 border-2 border-dashed border-stone-800 flex flex-col items-center justify-center text-center p-1 bg-stone-50 shrink-0">
          <span className="text-[8px] font-sans font-bold text-stone-500 uppercase leading-snug">
            Affix Recent<br />Passport Size<br />Color Photograph<br />(Self-Attested)
          </span>
        </div>
      </div>

      {/* Official Top Reference Strip */}
      <div className="grid grid-cols-4 gap-2 bg-stone-100 p-2 rounded border border-stone-300 text-[10px] font-sans">
        <div>
          <span className="font-bold text-stone-700">Academic Session:</span>{" "}
          <span className="font-mono font-bold text-stone-900">2026 - 2027</span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Admission No. (S.R.):</span>{" "}
          <span className="font-mono font-bold text-stone-900">_______________</span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Class Sought:</span>{" "}
          <span className="font-bold text-stone-900">_______________</span>
        </div>
        <div>
          <span className="font-bold text-stone-700">Date of Application:</span>{" "}
          <span className="font-bold text-stone-900">____/____/20___</span>
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
            <div className="mt-1 flex gap-1 font-mono text-center">
              {Array.from({ length: 26 }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 border border-stone-400 bg-stone-50/50 flex items-center justify-center text-[10px]"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <span className="font-bold">Date of Birth (in figures):</span>{" "}
              <span className="border-b border-dotted border-stone-900 inline-block w-28 text-center font-mono">
                DD / MM / YYYY
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-bold">Date of Birth (in words):</span>{" "}
              <span className="border-b border-dotted border-stone-900 inline-block w-72"></span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div>
              <span className="font-bold">Gender:</span> [ &nbsp; ] Boy &nbsp; [ &nbsp; ] Girl
            </div>
            <div>
              <span className="font-bold">Blood Group:</span> ____________
            </div>
            <div>
              <span className="font-bold">Nationality:</span> Indian
            </div>
            <div>
              <span className="font-bold">Religion:</span> ____________
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <span className="font-bold">Category:</span> [ ] Gen &nbsp; [ ] SC &nbsp; [ ] ST &nbsp; [ ] OBC
            </div>
            <div>
              <span className="font-bold">Aadhaar Card No.:</span> ____ - ____ - ____
            </div>
            <div>
              <span className="font-bold">APAAR / PEN ID:</span> ________________
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="font-bold">Previous School Attended:</span> ____________________________________
            </div>
            <div>
              <span className="font-bold">Last Class Passed:</span> ____________ &nbsp; <span className="font-bold">T.C. No:</span> ____________
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Parental & Family Details */}
      <div className="border border-stone-800 rounded-sm">
        <div className="bg-stone-800 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-sans">
          2. Parent / Guardian Particulars
        </div>
        <div className="p-2.5 space-y-2 text-[10.5px]">
          {/* Father Details */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <span className="font-bold">Father's Full Name:</span> ___________________________________________
            </div>
            <div>
              <span className="font-bold">Qualification:</span> ___________________
            </div>
            <div>
              <span className="font-bold">Occupation:</span> ___________________
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="font-bold">Father's Mobile No.:</span> ______________________
            </div>
            <div>
              <span className="font-bold">Annual Income (₹):</span> ______________________
            </div>
            <div>
              <span className="font-bold">PAN Number:</span> ______________________
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-stone-200">
            <div className="col-span-2">
              <span className="font-bold">Mother's Full Name:</span> ___________________________________________
            </div>
            <div>
              <span className="font-bold">Qualification:</span> ___________________
            </div>
            <div>
              <span className="font-bold">Occupation:</span> ___________________
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <span className="font-bold">Mother's Mobile:</span> ___________________
            </div>
            <div>
              <span className="font-bold">Annual Income (₹):</span> ___________________
            </div>
            <div>
              <span className="font-bold">Mother's Email:</span> ___________________
            </div>
            <div>
              <span className="font-bold">Mother's PAN:</span> ___________________
            </div>
          </div>

          {/* Address Details */}
          <div className="pt-1 border-t border-stone-200 space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold">Current Address:</span><br />
                <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
              </div>
              <div>
                <span className="font-bold">Permanent Address:</span><br />
                <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
                <span className="border-b border-dotted border-stone-900 inline-block w-full h-4 mt-1"></span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="col-span-2">
                <span className="font-bold">City / District:</span> Lucknow, Uttar Pradesh
              </div>
              <div>
                <span className="font-bold">PIN Code:</span> ___________________
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Medical Information & Enclosures */}
      <div className="grid grid-cols-2 gap-3">
        {/* Medical info */}
        <div className="border border-stone-800 rounded-sm p-2 space-y-1.5 text-[10px]">
          <div className="font-bold font-sans uppercase text-stone-900 border-b border-stone-300 pb-0.5">
            3. Medical & Emergency Info
          </div>
          <div>
            <span className="font-bold">Medical Conditions:</span> ___________________________
          </div>
          <div>
            <span className="font-bold">Known Allergies:</span> _______________________________
          </div>
          <div>
            <span className="font-bold">Emergency Contact:</span> ______________________________
          </div>
        </div>

        {/* Enclosures checklist */}
        <div className="border border-stone-800 rounded-sm p-2 space-y-1 text-[9.5px]">
          <div className="font-bold font-sans uppercase text-stone-900 border-b border-stone-300 pb-0.5">
            4. Enclosures Checklist (Self-Attested)
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>[ ] 1. Birth Certificate</div>
            <div>[ ] 2. Aadhaar Card (Student)</div>
            <div>[ ] 3. Transfer Certificate (T.C.)</div>
            <div>[ ] 4. Previous Marksheet</div>
            <div>[ ] 5. Caste Certificate (SC/ST/OBC)</div>
            <div>[ ] 6. 4 Passport Photos</div>
          </div>
        </div>
      </div>

      {/* Section 5: Parent / Guardian Declaration */}
      <div className="border border-stone-800 rounded-sm p-2.5 bg-stone-50/50 space-y-2 text-[9.5px]">
        <div className="font-bold font-sans uppercase text-stone-900">
          5. Declaration by Parent / Guardian
        </div>
        <p className="leading-tight text-stone-700 text-[9px] italic">
          “I hereby solemnly declare that the information provided above is true and correct to the best of my knowledge.
          I agree to abide by all the rules, code of conduct, and fee schedules of Town Hall Public High School. I understand that
          the Date of Birth entered above cannot be altered at any future date as per education board regulations.”
        </p>
        <div className="grid grid-cols-3 gap-4 pt-3 text-center text-[10px] font-sans">
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Signature of Father</div>
          </div>
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Signature of Mother</div>
          </div>
          <div>
            <div className="border-t border-stone-900 pt-1 font-bold">Date & Place</div>
          </div>
        </div>
      </div>

      {/* Section 6: For Office Use Only */}
      <div className="border-2 border-stone-900 rounded-sm p-2.5 bg-stone-100 text-[10px] font-sans space-y-2">
        <div className="font-bold uppercase tracking-wider text-stone-950 border-b border-stone-400 pb-0.5 flex justify-between items-center">
          <span>6. For Official Administrative Use Only</span>
          <span className="text-[9px] font-normal italic text-stone-600">Town Hall Admission Registry</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[9.5px]">
          <div>
            <span className="font-bold">S.R. No. Allotted:</span> ____________
          </div>
          <div>
            <span className="font-bold">Class Admitted:</span> ____________
          </div>
          <div>
            <span className="font-bold">Section:</span> ______ &nbsp; <span className="font-bold">Roll:</span> ______
          </div>
          <div>
            <span className="font-bold">Receipt No.:</span> ____________
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-3 text-center text-[9.5px]">
          <div>
            <div className="border-t border-stone-700 pt-1 font-bold">Admission In-Charge</div>
          </div>
          <div>
            <div className="border-t border-stone-700 pt-1 font-bold">Accounts / Fee In-Charge</div>
          </div>
          <div>
            <div className="border-t border-stone-700 pt-1 font-bold">Principal / Director (Seal)</div>
          </div>
        </div>
      </div>

    </div>
  );
}
