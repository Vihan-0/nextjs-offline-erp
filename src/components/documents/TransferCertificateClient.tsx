"use client";

import React, { useRef, useState, useTransition } from "react";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Home,
  ShieldCheck,
  Award,
  Edit3,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  ShieldAlert,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  TransferCertificate,
  type TransferCertificateData,
  TC_CLASSES,
} from "./TransferCertificate";
import { recordAuditLogAction } from "@/actions/audit";
import { issueTransferCertificate, type IssueTCPayload } from "@/actions/tcActions";

interface TransferCertificateClientProps {
  student: TransferCertificateData;
  isTcIssued?: boolean;
  tcRecord?: {
    id: string;
    tcNumber: string;
    leavingClass: string;
    leavingDate: string;
    reasonForLeaving?: string | null;
    conduct?: string;
    promotedTo?: string | null;
    feeDuesStatus?: string | null;
    status: string;
    receiptSignatureStatus: string;
  } | null;
  lastStudiedClass?: string;
}

export function TransferCertificateClient({
  student: initialStudent,
  isTcIssued = false,
  tcRecord = null,
  lastStudiedClass = "Class 1",
}: TransferCertificateClientProps) {
  const [data, setData] = useState<TransferCertificateData>(initialStudent);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Official TC Issuance modal state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueTcNumber, setIssueTcNumber] = useState(data.serialNo || "");
  const [issueLeavingDate, setIssueLeavingDate] = useState(new Date().toISOString().split("T")[0]);
  const [issueLeavingClass, setIssueLeavingClass] = useState(lastStudiedClass || "Class 1");
  const [issuePromotedTo, setIssuePromotedTo] = useState("");
  const [issueFeeDuesStatus, setIssueFeeDuesStatus] = useState("NIL");
  const [issueConduct, setIssueConduct] = useState("Good");
  const [issueReason, setIssueReason] = useState("Passed Higher Secondary / Matriculation");
  const [issueRemarks, setIssueRemarks] = useState("");
  const [issueResultMsg, setIssueResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isIssuing, startIssuing] = useTransition();

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `TC_${data.admissionNo.replace(/[^a-zA-Z0-9_-]/g, "_")}_${data.studentName.replace(/\s+/g, "_")}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 6mm 4mm;
      }
      @media print {
        html, body {
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .transfer-certificate-root {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: 100% !important;
          min-height: 100% !important;
          padding: 0 !important;
        }
      }
    `,
    onAfterPrint: () => {
      // Record print audit log asynchronously
      startTransition(async () => {
        await recordAuditLogAction({
          actionType: "PRINT_TC",
          studentSrNumber: data.admissionNo,
          traceCode: data.traceCode,
          prefix: "TC",
          details: {
            serialNo: data.serialNo,
            studentName: data.studentName,
            printedAt: new Date().toISOString(),
          },
        });
      });
    },
  });

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoomLevel(100);

  // Update helper for academic table cells
  const handleAcademicRowChange = (
    className: string,
    field: "dateOfAdmission" | "result" | "workAndConduct",
    value: string
  ) => {
    setData((prev) => {
      const history = { ...(prev.academicHistory || {}) };
      const row = { ...(history[className] || { className }) };
      row[field] = value;
      history[className] = row;
      return {
        ...prev,
        academicHistory: history,
      };
    });
  };

  const handleIssueOfficialTC = () => {
    if (!issueLeavingClass || !issueLeavingDate) {
      setIssueResultMsg({ ok: false, msg: "Leaving class and date of leaving are required." });
      return;
    }
    startIssuing(async () => {
      const res = await issueTransferCertificate({
        studentSrNumber: data.admissionNo,
        leavingClass: issueLeavingClass,
        leavingDate: issueLeavingDate,
        tcNumber: issueTcNumber.trim() || undefined,
        promotedTo: issuePromotedTo.trim() || undefined,
        feeDuesStatus: issueFeeDuesStatus.trim() || "NIL",
        issuedBy: "Principal",
        reasonForLeaving: issueReason,
        conduct: issueConduct,
        remarks: issueRemarks || undefined,
      });

      if (res.success) {
        setIssueResultMsg({
          ok: true,
          msg: res.message || "Transfer Certificate successfully processed.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        setIssueResultMsg({
          ok: false,
          msg: res.error || "Failed to issue Transfer Certificate.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 pb-16">
      {/* TC Record Freeze Alert Banner */}
      {isTcIssued ? (
        <div className="bg-red-950 text-red-200 border-b border-red-800 px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold text-white uppercase tracking-wide">
              Official TC Issued — Student Academic Record Permanently Frozen in Archive
            </span>
            <span className="font-mono text-red-300 font-bold">({tcRecord?.tcNumber || data.serialNo})</span>
          </div>
          <Link
            href="/tc-register"
            className="inline-flex items-center gap-1 font-bold text-red-100 hover:text-white underline shrink-0 transition-colors"
          >
            <span>View TC Register Archive &rarr;</span>
          </Link>
        </div>
      ) : null}

      {/* Top Application Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Navigation & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors shrink-0"
              title="Return to Home Dashboard"
            >
              <Home className="w-4 h-4 text-stone-700" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href={`/students/${encodeURIComponent(data.admissionNo)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors shrink-0"
              title="Return to Student Profile"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <div className="h-5 w-px bg-stone-200 hidden sm:block" />

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Transfer Certificate
                </span>
                <span className="font-mono text-xs font-bold text-stone-600">
                  {data.serialNo || data.admissionNo}
                </span>
              </div>
              <h1 className="text-sm font-black text-stone-900 truncate">
                {data.studentName} ({data.admissionNo})
              </h1>
            </div>
          </div>

          {/* Center / Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick S.R. Front Folio Link */}
            <Link
              href={`/students/${encodeURIComponent(data.admissionNo)}/sr-front-page`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>S.R. Folio</span>
            </Link>

            {/* Live Customizer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isEditing
                  ? "bg-amber-900 text-amber-100 border-amber-800"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Close Editor" : "Tweak TC Fields"}</span>
              {isEditing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white rounded-lg text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-stone-700 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white rounded-lg text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-white rounded-lg text-stone-500 hover:text-stone-800 transition-colors ml-1 border-l border-stone-200 cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Primary Print Button */}
            <button
              type="button"
              onClick={() => handlePrint()}
              className="flex items-center gap-2 bg-[#0f2e60] hover:bg-[#153a77] active:bg-[#0a2044] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-blue-900"
            >
              <Printer className="w-4 h-4" />
              <span>Print TC</span>
            </button>

            {/* Official TC Issue Button / Status Badge */}
            {isTcIssued ? (
              <Link
                href="/tc-register"
                className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-red-700 transition-colors shadow-xs"
              >
                <Lock className="w-4 h-4 text-red-400" />
                <span>TC Archive</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIssueModalOpen(true)}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-red-800"
              >
                <Award className="w-4 h-4" />
                <span>Issue Official TC</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Live Customizer Drawer */}
      {isEditing && (
        <div className="max-w-5xl w-full mx-auto mt-4 px-4 sm:px-6 no-print animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Live Transfer Certificate Form Editor
                </h3>
                <p className="text-xs text-stone-500">
                  Update any line item or academic table entry live before sending to printer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Serial No */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Serial No.</label>
                <input
                  type="text"
                  value={data.serialNo || ""}
                  onChange={(e) => setData({ ...data, serialNo: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Admission No */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Admission No -</label>
                <input
                  type="text"
                  value={data.admissionNo || ""}
                  onChange={(e) => setData({ ...data, admissionNo: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Pen No- */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pen No-</label>
                <input
                  type="text"
                  value={data.penNo || ""}
                  placeholder="e.g. 10098234871"
                  onChange={(e) => setData({ ...data, penNo: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Appar ID */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Appar ID</label>
                <input
                  type="text"
                  value={data.apparId || ""}
                  placeholder="e.g. 9812-4412-8821"
                  onChange={(e) => setData({ ...data, apparId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Student Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={data.studentName || ""}
                  onChange={(e) => setData({ ...data, studentName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">DOB</label>
                <input
                  type="text"
                  value={data.dateOfBirthFormatted || ""}
                  onChange={(e) => setData({ ...data, dateOfBirthFormatted: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Religion */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Religion-</label>
                <input
                  type="text"
                  value={data.religion || ""}
                  onChange={(e) => setData({ ...data, religion: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Caste */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Caste -</label>
                <input
                  type="text"
                  value={data.caste || ""}
                  onChange={(e) => setData({ ...data, caste: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Father Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Father Name -</label>
                <input
                  type="text"
                  value={data.fatherName || ""}
                  onChange={(e) => setData({ ...data, fatherName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Mother Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Mother Name -</label>
                <input
                  type="text"
                  value={data.motherName || ""}
                  onChange={(e) => setData({ ...data, motherName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Last Institution Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Last Institution Name</label>
                <input
                  type="text"
                  value={data.lastInstitutionName || ""}
                  onChange={(e) => setData({ ...data, lastInstitutionName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* T.C Status */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">T.C Status</label>
                <select
                  value={String(data.tcSubmitted || "Submitt")}
                  onChange={(e) => setData({ ...data, tcSubmitted: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold focus:outline-none focus:border-blue-600"
                >
                  <option value="Submitt">Submitt (Submitted)</option>
                  <option value="Not Submitt">Not Submitt (Not Submitted)</option>
                </select>
              </div>

              {/* Session */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Session</label>
                <input
                  type="text"
                  value={data.sessionYear || ""}
                  onChange={(e) => setData({ ...data, sessionYear: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Date of Removel */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Date of Removel -</label>
                <input
                  type="text"
                  value={data.dateOfRemoval || ""}
                  onChange={(e) => setData({ ...data, dateOfRemoval: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Issue Date -</label>
                <input
                  type="text"
                  value={data.issueDateFormatted || ""}
                  onChange={(e) => setData({ ...data, issueDateFormatted: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Academic History Table Quick Editor */}
            <div className="pt-3 border-t border-stone-100">
              <h4 className="font-bold text-xs uppercase text-stone-700 mb-2">
                13-Class History Records Table:
              </h4>
              <div className="max-h-52 overflow-y-auto border border-stone-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone-100 sticky top-0 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-2 w-16 text-center">Class</th>
                      <th className="p-2">Date of Admission</th>
                      <th className="p-2">Result</th>
                      <th className="p-2">Work & Conduct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {TC_CLASSES.map((cls) => {
                      const row = data.academicHistory?.[cls] || { className: cls };
                      return (
                        <tr key={cls} className="hover:bg-stone-50">
                          <td className="p-1.5 font-bold text-center">{cls}</td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.dateOfAdmission || ""}
                              placeholder="e.g. 05/04/2022"
                              onChange={(e) => handleAcademicRowChange(cls, "dateOfAdmission", e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.result || ""}
                              placeholder="e.g. Passed & Promoted"
                              onChange={(e) => handleAcademicRowChange(cls, "result", e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              value={row.workAndConduct || ""}
                              placeholder="e.g. Good"
                              onChange={(e) => handleAcademicRowChange(cls, "workAndConduct", e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Document Preview Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col items-center">
        <div
          className="transition-transform origin-top duration-150 shadow-2xl rounded-sm border border-stone-300"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <div ref={printRef}>
            <TransferCertificate data={data} />
          </div>
        </div>
      </main>

      {/* ── ISSUE OFFICIAL TC MODAL ────────────────────────────────────── */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-stone-300 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center border border-red-200">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-stone-900 text-sm uppercase">Issue Official Transfer Certificate</h2>
                  <p className="text-[11px] text-stone-500">Maker-Checker governance • Permanently freezes academic folio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIssueModalOpen(false);
                  setIssueResultMsg(null);
                }}
                className="text-stone-400 hover:text-stone-700 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-stone-800">
              {/* Scholar Information Readonly Card */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>{data.studentName}</span>
                  <span className="font-mono text-stone-600">S.R. {data.admissionNo}</span>
                </div>
                <div className="text-[11px] text-stone-500 flex gap-4">
                  <span>Father: {data.fatherName}</span>
                  <span>DOB: {data.dateOfBirthFormatted}</span>
                </div>
              </div>

              {/* 1. TC Number & Date of Leaving */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    TC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={issueTcNumber}
                    onChange={(e) => setIssueTcNumber(e.target.value)}
                    placeholder="e.g. TC/2026/001"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Date of Leaving <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueLeavingDate}
                    onChange={(e) => setIssueLeavingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              {/* 2. Last Class Studied & Promoted To */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Last Class Studied <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={issueLeavingClass}
                    onChange={(e) => setIssueLeavingClass(e.target.value)}
                    placeholder="e.g. Class 2"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Promoted To
                  </label>
                  <input
                    type="text"
                    value={issuePromotedTo}
                    onChange={(e) => setIssuePromotedTo(e.target.value)}
                    placeholder="e.g. Promoted to Class 3"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. Fee Dues Status & Conduct */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Fee Dues Status
                  </label>
                  <input
                    type="text"
                    value={issueFeeDuesStatus}
                    onChange={(e) => setIssueFeeDuesStatus(e.target.value)}
                    placeholder="NIL (All dues cleared)"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Conduct / Behavior
                  </label>
                  <select
                    value={issueConduct}
                    onChange={(e) => setIssueConduct(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none font-bold"
                  >
                    {["Excellent", "Very Good", "Good", "Satisfactory", "Fair"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Reason for Leaving */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Reason for Leaving
                </label>
                <select
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none mb-1.5"
                >
                  <option value="Passed Higher Secondary / Matriculation">Passed Higher Secondary / Matriculation</option>
                  <option value="Parent Transfer">Parent Transfer</option>
                  <option value="Admission in Another School">Admission in Another School</option>
                  <option value="Migration to Another City">Migration to Another City</option>
                  <option value="Family Reason">Family Reason</option>
                  <option value="Other">Other (Specify in Remarks)</option>
                </select>
              </div>

              {/* 5. Remarks */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  TC Remarks (Optional)
                </label>
                <textarea
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  rows={2}
                  placeholder="Additional notes for TC ledger..."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
              </div>

              {/* Status message */}
              {issueResultMsg && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
                    issueResultMsg.ok
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-red-50 text-red-800 border-red-300"
                  }`}
                >
                  {issueResultMsg.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{issueResultMsg.msg}</span>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50">
              <span className="text-[10px] text-stone-500">
                Authorized staff submission • Maker-Checker audited
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIssueOfficialTC}
                  disabled={isIssuing}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isIssuing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      <span>Issue / Freeze Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
