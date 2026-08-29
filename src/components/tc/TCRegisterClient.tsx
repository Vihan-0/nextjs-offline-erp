"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search, Plus, FileText, CheckCircle2, Clock, ChevronRight,
  X, Save, Loader2, AlertCircle, User, PenLine, ReceiptText,
} from "lucide-react";
import {
  issueTransferCertificate,
  updateTCReceiverDetails,
  type IssueTCPayload,
} from "@/actions/tcActions";

// ─── Types ────────────────────────────────────────────────────────────
interface TCRecord {
  id: string;
  tcNumber: string;
  studentSrNumber: string;
  studentName: string;
  fatherName: string;
  leavingClass: string;
  leavingDate: Date;
  yearsStudied: string;
  issueDate: Date;
  issuedBy: string;
  reasonForLeaving?: string | null;
  conduct: string;
  receivedByName?: string | null;
  receivedByRelation?: string | null;
  receivedDate?: Date | null;
  receiptSignatureStatus: string;
  status: string;
  remarks?: string | null;
  traceCode: string;
  student: { srNumber: string; firstName: string; lastName: string; photoPath?: string | null; generalRemark?: string | null };
}

interface StudentOption {
  srNumber: string;
  firstName: string;
  lastName: string;
  academicSessions: { className: string; createdAt: Date }[];
  parents: { firstName: string; lastName: string }[];
}

interface TCRegisterClientProps {
  tcRecords: TCRecord[];
  allStudents: StudentOption[];
  studentsWithTC: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const CONDUCT_OPTIONS = ["Excellent", "Very Good", "Good", "Satisfactory", "Fair"];
const REASON_OPTIONS = [
  "Passed Higher Secondary / Matriculation",
  "Parent Transfer",
  "Admission in Another School",
  "Migration to Another City",
  "Family Reason",
  "Other",
];
const RELATION_OPTIONS = ["Father", "Mother", "Guardian", "Self", "Relative"];

// ─── Main Component ───────────────────────────────────────────────────
export function TCRegisterClient({ tcRecords: initialRecords, allStudents, studentsWithTC }: TCRegisterClientProps) {
  const [records, setRecords] = useState<TCRecord[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SIGNED" | "PENDING_COLLECTION">("ALL");

  // Issue TC modal
  const [issuingModal, setIssuingModal] = useState(false);
  const [selectedSR, setSelectedSR] = useState("");
  const [leavingClass, setLeavingClass] = useState("");
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split("T")[0]);
  const [issuedBy, setIssuedBy] = useState("Principal");
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [conduct, setConduct] = useState("Good");
  const [tcRemarks, setTcRemarks] = useState("");
  const [issueStatus, setIssueStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Receiver modal
  const [receiverModal, setReceiverModal] = useState<TCRecord | null>(null);
  const [receivedByName, setReceivedByName] = useState("");
  const [receivedByRelation, setReceivedByRelation] = useState("Father");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiverStatus, setReceiverStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isReceiverPending, startReceiverTransition] = useTransition();

  // Filter logic
  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.tcNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.studentSrNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.fatherName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || r.receiptSignatureStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Students eligible for new TC (no TC yet)
  const eligibleStudents = allStudents.filter((s) => !studentsWithTC.includes(s.srNumber));

  // ── Handle Issue TC ────────────────────────────────────────────────
  const handleIssueTC = () => {
    if (!selectedSR || !leavingClass || !leavingDate) {
      setIssueStatus({ ok: false, msg: "Please fill in all required fields." });
      return;
    }
    startTransition(async () => {
      const payload: IssueTCPayload = {
        studentSrNumber: selectedSR,
        leavingClass,
        leavingDate,
        issuedBy,
        reasonForLeaving: reason,
        conduct,
        remarks: tcRemarks || undefined,
      };
      const res = await issueTransferCertificate(payload);
      if (res.success && res.tcRecord) {
        setIssueStatus({ ok: true, msg: `TC ${res.tcRecord.tcNumber} issued successfully.` });
        // Refresh locally
        const newRecord = res.tcRecord as unknown as TCRecord;
        const student = allStudents.find((s) => s.srNumber === selectedSR);
        if (student) {
          (newRecord as TCRecord).student = {
            srNumber: student.srNumber,
            firstName: student.firstName,
            lastName: student.lastName,
          };
        }
        setRecords((prev) => [newRecord, ...prev]);
        setTimeout(() => {
          setIssuingModal(false);
          setIssueStatus(null);
          setSelectedSR("");
          setLeavingClass("");
          setTcRemarks("");
        }, 2000);
      } else {
        setIssueStatus({ ok: false, msg: res.error || "Failed to issue TC." });
      }
    });
  };

  // ── Handle Update Receiver ─────────────────────────────────────────
  const openReceiverModal = (record: TCRecord) => {
    setReceiverModal(record);
    setReceivedByName(record.receivedByName || "");
    setReceivedByRelation(record.receivedByRelation || "Father");
    setReceivedDate(record.receivedDate ? new Date(record.receivedDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setReceiverStatus(null);
  };

  const handleUpdateReceiver = () => {
    if (!receiverModal || !receivedByName.trim()) {
      setReceiverStatus({ ok: false, msg: "Receiver name is required." });
      return;
    }
    startReceiverTransition(async () => {
      const res = await updateTCReceiverDetails({
        tcId: receiverModal.id,
        receivedByName,
        receivedByRelation,
        receivedDate,
        receiptSignatureStatus: "SIGNED",
      });
      if (res.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === receiverModal.id
              ? { ...r, receivedByName, receivedByRelation, receivedDate: new Date(receivedDate), receiptSignatureStatus: "SIGNED" }
              : r
          )
        );
        setReceiverStatus({ ok: true, msg: "Receiver details saved. TC marked as SIGNED." });
        setTimeout(() => {
          setReceiverModal(null);
          setReceiverStatus(null);
        }, 1800);
      } else {
        setReceiverStatus({ ok: false, msg: res.error || "Failed to update receiver." });
      }
    });
  };

  return (
    <>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, TC number, SR number, father…"
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-500/60 placeholder:text-zinc-600 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "SIGNED", "PENDING_COLLECTION"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                filterStatus === s
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {s === "ALL" ? "All" : s === "SIGNED" ? "✓ Signed" : "⏳ Pending"}
            </button>
          ))}
          <button
            onClick={() => setIssuingModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Issue TC
          </button>
        </div>
      </div>

      {/* TC Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl space-y-3">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-sm font-bold text-zinc-400">No Transfer Certificates Found</p>
          <p className="text-xs text-zinc-600">
            {search ? "Try a different search term." : "Issue the first TC using the button above."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-100">{record.studentName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          record.receiptSignatureStatus === "SIGNED"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                            : "bg-amber-950/60 text-amber-400 border-amber-800/60"
                        }`}
                      >
                        {record.receiptSignatureStatus === "SIGNED" ? "✓ Signed" : "⏳ Pending Collection"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      S.R.: <span className="font-mono text-zinc-300">{record.studentSrNumber}</span>
                      {" · "} Father: <span className="text-zinc-300">{record.fatherName}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-400 pt-0.5">
                      <span><span className="text-zinc-600">TC No:</span> <span className="font-mono font-bold text-red-300">{record.tcNumber}</span></span>
                      <span><span className="text-zinc-600">Left Class:</span> {record.leavingClass}</span>
                      <span><span className="text-zinc-600">Leaving Date:</span> {formatDate(record.leavingDate)}</span>
                      <span><span className="text-zinc-600">Years:</span> {record.yearsStudied}</span>
                      <span><span className="text-zinc-600">Conduct:</span> {record.conduct}</span>
                      <span><span className="text-zinc-600">Issued By:</span> {record.issuedBy}</span>
                    </div>
                    {record.receivedByName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Collected by <strong>{record.receivedByName}</strong> ({record.receivedByRelation}) on {formatDate(record.receivedDate)}
                      </div>
                    )}
                    {record.remarks && (
                      <p className="text-[11px] text-zinc-500 mt-1 italic">"{record.remarks}"</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/students/${encodeURIComponent(record.studentSrNumber)}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    Profile
                  </Link>
                  {record.receiptSignatureStatus !== "SIGNED" && (
                    <button
                      onClick={() => openReceiverModal(record)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition-colors"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Sign / Collect
                    </button>
                  )}
                  <Link
                    href={`/verify/${encodeURIComponent(record.traceCode)}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-800 transition-colors"
                    title="Verify TC trace code"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                    Verify
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ISSUE TC MODAL ──────────────────────────────────────────────── */}
      {issuingModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-100 text-sm">Issue Transfer Certificate</h2>
                  <p className="text-[10px] text-zinc-500">Creates an official TC record in the archive</p>
                </div>
              </div>
              <button onClick={() => { setIssuingModal(false); setIssueStatus(null); }} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Student select */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Student <span className="text-red-400">*</span></label>
                <select
                  value={selectedSR}
                  onChange={(e) => {
                    setSelectedSR(e.target.value);
                    const s = eligibleStudents.find((st) => st.srNumber === e.target.value);
                    if (s?.academicSessions[0]) setLeavingClass(s.academicSessions[0].className);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                >
                  <option value="">— Select Student —</option>
                  {eligibleStudents.map((s) => (
                    <option key={s.srNumber} value={s.srNumber}>
                      {s.firstName} {s.lastName} ({s.srNumber}) {s.academicSessions[0] ? `— ${s.academicSessions[0].className}` : ""}
                    </option>
                  ))}
                </select>
                {eligibleStudents.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">All students already have TCs issued.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Leaving Class <span className="text-red-400">*</span></label>
                  <input
                    value={leavingClass}
                    onChange={(e) => setLeavingClass(e.target.value)}
                    placeholder="e.g. CLASS IX"
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60 uppercase placeholder:normal-case"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Leaving Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={leavingDate}
                    onChange={(e) => setLeavingDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Conduct</label>
                  <select
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                  >
                    {CONDUCT_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Issued By</label>
                  <input
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                    placeholder="Principal"
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Reason for Leaving</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                >
                  {REASON_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">TC Remarks (optional)</label>
                <textarea
                  value={tcRemarks}
                  onChange={(e) => setTcRemarks(e.target.value)}
                  rows={2}
                  placeholder="Any special notes for this TC…"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/60 resize-none placeholder:text-zinc-600"
                />
              </div>

              {issueStatus && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border ${issueStatus.ok ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" : "bg-red-950/60 text-red-400 border-red-800/60"}`}>
                  {issueStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {issueStatus.msg}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <button onClick={() => setIssuingModal(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleIssueTC}
                disabled={isPending || !selectedSR}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl border border-red-500 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPending ? "Issuing…" : "Issue TC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVER / SIGN MODAL ───────────────────────────────────────── */}
      {receiverModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-100 text-sm">Sign & Collect TC</h2>
                  <p className="text-[10px] text-zinc-500">{receiverModal.tcNumber} — {receiverModal.studentName}</p>
                </div>
              </div>
              <button onClick={() => setReceiverModal(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Received By (Full Name) <span className="text-red-400">*</span></label>
                <input
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Relation to Student</label>
                  <select
                    value={receivedByRelation}
                    onChange={(e) => setReceivedByRelation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  >
                    {RELATION_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Date of Collection</label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 space-y-0.5">
                <p className="font-bold text-zinc-300">Acknowledgement</p>
                <p>By saving, you confirm that the TC has been physically handed over and the receiver has acknowledged receipt. This action marks the TC as SIGNED.</p>
              </div>

              {receiverStatus && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border ${receiverStatus.ok ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" : "bg-red-950/60 text-red-400 border-red-800/60"}`}>
                  {receiverStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {receiverStatus.msg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <button onClick={() => setReceiverModal(null)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleUpdateReceiver}
                disabled={isReceiverPending}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl border border-emerald-600 transition-colors disabled:opacity-50"
              >
                {isReceiverPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isReceiverPending ? "Saving…" : "Mark as Signed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
