"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, IndianRupee, User, AlertTriangle, CheckCircle2,
  X, Save, Loader2, AlertCircle, ChevronRight, Receipt,
  Clock, CreditCard, Banknote, Smartphone, Building2,
  Percent, Tag, MessageSquare, CalendarClock, Eye,
} from "lucide-react";
import {
  upsertStudentFeeProfile,
  recordFeePayment,
  type UpsertFeeProfilePayload,
  type RecordFeePaymentPayload,
} from "@/actions/feeActions";

// ─── Types ────────────────────────────────────────────
interface Payment {
  id: string;
  receiptNumber: string;
  studentSrNumber: string;
  monthCovered: string;
  installmentNumber: number;
  installmentPaid: number;
  lateFeeFine: number;
  totalPaid: number;
  modeOfPayment: string;
  transactionReference?: string | null;
  paymentReceivedBy: string;
  paymentDate: Date;
  dueDate: Date;
  status: string;
  remarks?: string | null;
}

interface FeeProfile {
  id: string;
  studentSrNumber: string;
  sessionYear: string;
  className: string;
  baseMonthlyFee: number;
  hasConcession: boolean;
  concessionType?: string | null;
  concessionPercentage?: number | null;
  concessionAmount?: number | null;
  concessionReason?: string | null;
  netMonthlyFee: number;
  lateFeeRatePerMonth: number;
  feeRemarks?: string | null;
  student: { firstName: string; lastName: string; srNumber: string; photoPath?: string | null };
  payments: Payment[];
  currentMonthPaid: boolean;
  isOverdueNow: boolean;
  suggestedLateFine: number;
  totalCollected: number;
  paidMonthsList: string[];
}

interface StudentOption {
  srNumber: string;
  firstName: string;
  lastName: string;
  academicSessions: { className: string }[];
}

interface FeesDashboardClientProps {
  profiles: FeeProfile[];
  recentPayments: Payment[];
  allStudents: StudentOption[];
  currentMonthLabel: string;
}

// ─── Constants ────────────────────────────────────────
const MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];
const CONCESSION_TYPES = [
  { value: "SIBLING", label: "Sibling Concession" },
  { value: "SINGLE_PARENT", label: "Single Parent Concession" },
  { value: "NEED_BASED", label: "Need Based Concession" },
  { value: "STAFF_WARD", label: "Staff Ward" },
  { value: "MERIT", label: "Merit Scholarship" },
];
const PAYMENT_MODES = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CHEQUE", label: "Cheque", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
];

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

// ─── Main Component ───────────────────────────────────
export function FeesDashboardClient({ profiles: initialProfiles, recentPayments, allStudents, currentMonthLabel }: FeesDashboardClientProps) {
  const [profiles, setProfiles] = useState<FeeProfile[]>(initialProfiles);
  const [search, setSearch] = useState("");
  const [filterView, setFilterView] = useState<"ALL" | "OVERDUE" | "PAID">("ALL");
  const [activeTab, setActiveTab] = useState<"profiles" | "recent">("profiles");

  // ── Modals ──
  const [profileModal, setProfileModal] = useState(false);
  const [collectModal, setCollectModal] = useState<FeeProfile | null>(null);
  const [historyModal, setHistoryModal] = useState<FeeProfile | null>(null);

  // ── Create/Edit Profile Form ──
  const [pfSR, setPfSR] = useState("");
  const [pfBaseFee, setPfBaseFee] = useState("2000");
  const [pfHasConcession, setPfHasConcession] = useState(false);
  const [pfConcessionType, setPfConcessionType] = useState("SIBLING");
  const [pfConcessionPct, setPfConcessionPct] = useState("");
  const [pfConcessionAmt, setPfConcessionAmt] = useState("");
  const [pfConcessionReason, setPfConcessionReason] = useState("");
  const [pfRemarks, setPfRemarks] = useState("");
  const [pfStatus, setPfStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPfPending, startPfTransition] = useTransition();

  // ── Collect Payment Form ──
  const [cpMonth, setCpMonth] = useState(currentMonthLabel);
  const [cpInstallment, setCpInstallment] = useState("1");
  const [cpAmount, setCpAmount] = useState("");
  const [cpLateFine, setCpLateFine] = useState("0");
  const [cpMode, setCpMode] = useState("CASH");
  const [cpTxnRef, setCpTxnRef] = useState("");
  const [cpReceivedBy, setCpReceivedBy] = useState("");
  const [cpRemarks, setCpRemarks] = useState("");
  const [cpStatus, setCpStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isCpPending, startCpTransition] = useTransition();

  // ── Filtering ──
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const name = `${p.student.firstName} ${p.student.lastName}`.toLowerCase();
      const matchSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        p.student.srNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.className.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filterView === "ALL" ||
        (filterView === "OVERDUE" && p.isOverdueNow) ||
        (filterView === "PAID" && p.currentMonthPaid);
      return matchSearch && matchFilter;
    });
  }, [profiles, search, filterView]);

  // Students that don't yet have a fee profile
  const studentsWithoutProfile = useMemo(() => {
    const srWithProfile = new Set(profiles.map((p) => p.studentSrNumber));
    return allStudents.filter((s) => !srWithProfile.has(s.srNumber));
  }, [profiles, allStudents]);

  // ── Handle Create Fee Profile ──
  const handleCreateProfile = () => {
    const baseFee = parseFloat(pfBaseFee);
    if (!pfSR || isNaN(baseFee) || baseFee <= 0) {
      setPfStatus({ ok: false, msg: "Select a student and enter a valid monthly fee." });
      return;
    }
    const student = allStudents.find((s) => s.srNumber === pfSR);
    const className = student?.academicSessions[0]?.className || "—";

    startPfTransition(async () => {
      const payload: UpsertFeeProfilePayload = {
        studentSrNumber: pfSR,
        sessionYear: "2026-2027",
        className,
        baseMonthlyFee: baseFee,
        hasConcession: pfHasConcession,
        concessionType: pfHasConcession ? pfConcessionType : undefined,
        concessionPercentage: pfHasConcession && pfConcessionPct ? parseFloat(pfConcessionPct) : undefined,
        concessionAmount: pfHasConcession && pfConcessionAmt ? parseFloat(pfConcessionAmt) : undefined,
        concessionReason: pfHasConcession ? pfConcessionReason : undefined,
        feeRemarks: pfRemarks || undefined,
      };
      const res = await upsertStudentFeeProfile(payload);
      if (res.success) {
        setPfStatus({ ok: true, msg: `Fee profile created for ${student?.firstName} ${student?.lastName}.` });
        setTimeout(() => {
          setProfileModal(false);
          setPfStatus(null);
          // Full page reload to get fresh server data
          window.location.reload();
        }, 1500);
      } else {
        setPfStatus({ ok: false, msg: res.error || "Failed to create fee profile." });
      }
    });
  };

  // ── Handle Collect Payment ──
  const openCollectModal = (profile: FeeProfile) => {
    setCollectModal(profile);
    setCpMonth(currentMonthLabel);
    setCpInstallment("1");
    setCpAmount(String(profile.netMonthlyFee));
    setCpLateFine(String(profile.suggestedLateFine));
    setCpMode("CASH");
    setCpTxnRef("");
    setCpReceivedBy("");
    setCpRemarks("");
    setCpStatus(null);
  };

  const handleCollectPayment = () => {
    if (!collectModal) return;
    const amount = parseFloat(cpAmount);
    const fine = parseFloat(cpLateFine) || 0;
    if (isNaN(amount) || amount <= 0 || !cpReceivedBy.trim()) {
      setCpStatus({ ok: false, msg: "Amount and cashier name are required." });
      return;
    }

    // Build due date: 10th of the covered month
    const monthParts = cpMonth.split(" ");
    const monthStr = monthParts[0];
    const yearStr = monthParts[1] || String(new Date().getFullYear());
    const dueDate = new Date(`${monthStr} 10, ${yearStr}`);
    if (isNaN(dueDate.getTime())) {
      setCpStatus({ ok: false, msg: "Invalid month selection." });
      return;
    }

    startCpTransition(async () => {
      const payload: RecordFeePaymentPayload = {
        studentSrNumber: collectModal.studentSrNumber,
        feeProfileId: collectModal.id,
        sessionYear: collectModal.sessionYear,
        className: collectModal.className,
        monthCovered: cpMonth,
        installmentNumber: parseInt(cpInstallment) || 1,
        installmentPaid: amount,
        lateFeeFine: fine,
        modeOfPayment: cpMode,
        transactionReference: cpTxnRef || undefined,
        paymentReceivedBy: cpReceivedBy.trim(),
        dueDate: dueDate.toISOString(),
        remarks: cpRemarks || undefined,
      };
      const res = await recordFeePayment(payload);
      if (res.success) {
        setCpStatus({ ok: true, msg: `Payment recorded. Receipt: ${res.payment?.receiptNumber}` });
        setTimeout(() => {
          setCollectModal(null);
          setCpStatus(null);
          window.location.reload();
        }, 2000);
      } else {
        setCpStatus({ ok: false, msg: res.error || "Failed to record payment." });
      }
    });
  };

  // ── Generate month options for the current academic year ──
  const monthOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return MONTHS.map((m) => {
      const yr = ["January", "February", "March"].includes(m) ? currentYear + 1 : currentYear;
      return `${m} ${yr}`;
    });
  }, []);

  return (
    <>
      {/* Tab bar + controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(["profiles", "recent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "profiles" ? "Student Fees" : "Recent Payments"}
            </button>
          ))}
        </div>

        {activeTab === "profiles" && (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SR number, class…"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(["ALL", "OVERDUE", "PAID"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterView(f)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                    filterView === f
                      ? f === "OVERDUE"
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-emerald-600 text-white border-emerald-500"
                      : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "OVERDUE" ? "⚠ Overdue" : "✓ Paid"}
                </button>
              ))}
              <button
                onClick={() => { setProfileModal(true); setPfStatus(null); setPfSR(""); setPfHasConcession(false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Profile
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── PROFILES TAB ──────────────────────────────────────── */}
      {activeTab === "profiles" && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl space-y-3">
              <IndianRupee className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No Fee Profiles Found</p>
              <p className="text-xs text-zinc-600">
                {search ? "Try a different search." : "Add a fee profile using the button above."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((profile) => {
                const name = `${profile.student.firstName} ${profile.student.lastName}`.trim();
                return (
                  <div
                    key={profile.id}
                    className={`bg-zinc-900/70 border rounded-2xl p-5 hover:border-zinc-600 transition-colors ${
                      profile.isOverdueNow ? "border-red-800/60" : "border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          profile.isOverdueNow
                            ? "bg-red-950/60 border-red-800/60"
                            : profile.currentMonthPaid
                            ? "bg-emerald-950/60 border-emerald-800/60"
                            : "bg-zinc-800 border-zinc-700"
                        }`}>
                          <User className={`w-5 h-5 ${
                            profile.isOverdueNow ? "text-red-400" : profile.currentMonthPaid ? "text-emerald-400" : "text-zinc-400"
                          }`} />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-zinc-100">{name}</span>
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                              {profile.student.srNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                              {profile.className}
                            </span>
                            {/* Status badge */}
                            {profile.isOverdueNow ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-950/60 text-red-400 border-red-800/60 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue — {formatCurrency(profile.suggestedLateFine)} fine
                              </span>
                            ) : profile.currentMonthPaid ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-950/60 text-emerald-400 border-emerald-800/60 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Paid
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-950/60 text-amber-400 border-amber-800/60 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due
                              </span>
                            )}
                          </div>
                          {/* Fee details */}
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-400">
                            <span><span className="text-zinc-600">Base:</span> {formatCurrency(profile.baseMonthlyFee)}/mo</span>
                            {profile.hasConcession && (
                              <span className="text-cyan-400">
                                <Tag className="w-3 h-3 inline mr-0.5" />
                                {profile.concessionType?.replace("_", " ")}
                                {profile.concessionPercentage ? ` (${profile.concessionPercentage}%)` : ""}
                                {profile.concessionAmount ? ` (₹${profile.concessionAmount})` : ""}
                              </span>
                            )}
                            <span><span className="text-zinc-600">Net:</span> <span className="font-bold text-zinc-200">{formatCurrency(profile.netMonthlyFee)}/mo</span></span>
                            <span><span className="text-zinc-600">Collected:</span> <span className="font-mono text-emerald-400">{formatCurrency(profile.totalCollected)}</span></span>
                            <span><span className="text-zinc-600">Payments:</span> {profile.payments.length}</span>
                          </div>
                          {profile.feeRemarks && (
                            <p className="text-[11px] text-zinc-500 italic flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {profile.feeRemarks}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <button
                          onClick={() => openCollectModal(profile)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition-colors"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          Collect Fee
                        </button>
                        <button
                          onClick={() => setHistoryModal(profile)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          History
                        </button>
                        <Link
                          href={`/students/${encodeURIComponent(profile.studentSrNumber)}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-800 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── RECENT PAYMENTS TAB ───────────────────────────────── */}
      {activeTab === "recent" && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
          {recentPayments.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Receipt className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-400 font-bold">No Payments Recorded Yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 bg-zinc-950/60">
                    <th className="py-3 px-4 font-semibold">Receipt #</th>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Month</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Late Fine</th>
                    <th className="py-3 px-4 font-semibold">Total</th>
                    <th className="py-3 px-4 font-semibold">Mode</th>
                    <th className="py-3 px-4 font-semibold">Received By</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{p.receiptNumber}</td>
                      <td className="py-2.5 px-4 font-mono text-zinc-300">{p.studentSrNumber}</td>
                      <td className="py-2.5 px-4 text-zinc-300">{p.monthCovered}</td>
                      <td className="py-2.5 px-4 font-mono text-zinc-200">{formatCurrency(p.installmentPaid)}</td>
                      <td className="py-2.5 px-4 font-mono text-red-400">{p.lateFeeFine > 0 ? formatCurrency(p.lateFeeFine) : "—"}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-100">{formatCurrency(p.totalPaid)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                          {p.modeOfPayment}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400">{p.paymentReceivedBy}</td>
                      <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px]">{formatDate(p.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           ADD FEE PROFILE MODAL
         ══════════════════════════════════════════════════════════ */}
      {profileModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-100 text-sm">Set Up Fee Profile</h2>
                  <p className="text-[10px] text-zinc-500">Define monthly fee, concessions, and billing notes</p>
                </div>
              </div>
              <button onClick={() => setProfileModal(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Student select */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Student <span className="text-red-400">*</span></label>
                <select
                  value={pfSR}
                  onChange={(e) => setPfSR(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                >
                  <option value="">— Select Student —</option>
                  {studentsWithoutProfile.map((s) => (
                    <option key={s.srNumber} value={s.srNumber}>
                      {s.firstName} {s.lastName} ({s.srNumber}) {s.academicSessions[0] ? `— ${s.academicSessions[0].className}` : ""}
                    </option>
                  ))}
                </select>
                {studentsWithoutProfile.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">All students already have fee profiles.</p>
                )}
              </div>

              {/* Base fee */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Monthly Fee (₹) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    value={pfBaseFee}
                    onChange={(e) => setPfBaseFee(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              {/* Concession toggle */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pfHasConcession}
                    onChange={(e) => setPfHasConcession(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-200">Apply Concession</span>
                  </div>
                </label>

                {pfHasConcession && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">Concession Type</label>
                      <select
                        value={pfConcessionType}
                        onChange={(e) => setPfConcessionType(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                      >
                        {CONCESSION_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">Discount %</label>
                        <input
                          type="number"
                          value={pfConcessionPct}
                          onChange={(e) => { setPfConcessionPct(e.target.value); setPfConcessionAmt(""); }}
                          placeholder="e.g. 25"
                          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1.5">OR Flat ₹ Off</label>
                        <input
                          type="number"
                          value={pfConcessionAmt}
                          onChange={(e) => { setPfConcessionAmt(e.target.value); setPfConcessionPct(""); }}
                          placeholder="e.g. 500"
                          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">Reason</label>
                      <input
                        value={pfConcessionReason}
                        onChange={(e) => setPfConcessionReason(e.target.value)}
                        placeholder="Justification for concession"
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60"
                      />
                    </div>
                    {/* Live preview */}
                    {pfBaseFee && (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs">
                        <span className="text-zinc-500">Net Fee: </span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatCurrency(
                            Math.max(0,
                              parseFloat(pfBaseFee || "0") -
                                (pfConcessionAmt ? parseFloat(pfConcessionAmt || "0") : 0) -
                                (pfConcessionPct ? (parseFloat(pfBaseFee || "0") * parseFloat(pfConcessionPct || "0")) / 100 : 0)
                            )
                          )}/mo
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Fee Remarks (optional)</label>
                <textarea
                  value={pfRemarks}
                  onChange={(e) => setPfRemarks(e.target.value)}
                  rows={2}
                  placeholder="Billing commitments, special notes…"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60 resize-none placeholder:text-zinc-600"
                />
              </div>

              {pfStatus && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border ${pfStatus.ok ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" : "bg-red-950/60 text-red-400 border-red-800/60"}`}>
                  {pfStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {pfStatus.msg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <button onClick={() => setProfileModal(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-700 bg-zinc-900 transition-colors">Cancel</button>
              <button
                onClick={handleCreateProfile}
                disabled={isPfPending || !pfSR}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl border border-emerald-500 transition-colors disabled:opacity-50"
              >
                {isPfPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPfPending ? "Saving…" : "Create Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           COLLECT FEE MODAL
         ══════════════════════════════════════════════════════════ */}
      {collectModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-100 text-sm">Collect Fee Payment</h2>
                  <p className="text-[10px] text-zinc-500">
                    {collectModal.student.firstName} {collectModal.student.lastName} · Net: {formatCurrency(collectModal.netMonthlyFee)}/mo
                  </p>
                </div>
              </div>
              <button onClick={() => setCollectModal(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Overdue warning banner */}
              {collectModal.isOverdueNow && (
                <div className="flex items-center gap-3 bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold text-red-300">Overdue Payment Alert</p>
                    <p className="text-red-400/80">
                      Suggested late fine of <strong>{formatCurrency(collectModal.suggestedLateFine)}</strong> has been auto-populated.
                      You may adjust or waive it below.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Month <span className="text-red-400">*</span></label>
                  <select
                    value={cpMonth}
                    onChange={(e) => setCpMonth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  >
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>{m} {collectModal.paidMonthsList.includes(m) ? "✓" : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Installment #</label>
                  <select
                    value={cpInstallment}
                    onChange={(e) => setCpInstallment(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  >
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Installment {n}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">Amount (₹) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number"
                      value={cpAmount}
                      onChange={(e) => setCpAmount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Late Fine (₹)
                    {collectModal.isOverdueNow && (
                      <span className="text-red-400 ml-1">· waivable</span>
                    )}
                  </label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/60" />
                    <input
                      type="number"
                      value={cpLateFine}
                      onChange={(e) => setCpLateFine(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-red-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* Live total preview */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Total to be collected:</span>
                <span className="font-bold font-mono text-lg text-emerald-400">
                  {formatCurrency((parseFloat(cpAmount) || 0) + (parseFloat(cpLateFine) || 0))}
                </span>
              </div>

              {/* Payment mode */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => setCpMode(mode.value)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                          cpMode === mode.value
                            ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {cpMode !== "CASH" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    {cpMode === "UPI" ? "UPI UTR / Transaction ID" : cpMode === "CHEQUE" ? "Cheque Number" : "Transfer Reference"}
                  </label>
                  <input
                    value={cpTxnRef}
                    onChange={(e) => setCpTxnRef(e.target.value)}
                    placeholder="Reference number…"
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Payment Received By <span className="text-red-400">*</span></label>
                <input
                  value={cpReceivedBy}
                  onChange={(e) => setCpReceivedBy(e.target.value)}
                  placeholder="Cashier / Staff name"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Remarks (optional)</label>
                <input
                  value={cpRemarks}
                  onChange={(e) => setCpRemarks(e.target.value)}
                  placeholder="Any notes for this payment…"
                  className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/60"
                />
              </div>

              {cpStatus && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border ${cpStatus.ok ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60" : "bg-red-950/60 text-red-400 border-red-800/60"}`}>
                  {cpStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {cpStatus.msg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <button onClick={() => setCollectModal(null)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-700 bg-zinc-900 transition-colors">Cancel</button>
              <button
                onClick={handleCollectPayment}
                disabled={isCpPending}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl border border-emerald-500 transition-colors disabled:opacity-50"
              >
                {isCpPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                {isCpPending ? "Processing…" : "Collect & Generate Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           PAYMENT HISTORY MODAL
         ══════════════════════════════════════════════════════════ */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-100 text-sm">Payment History</h2>
                  <p className="text-[10px] text-zinc-500">
                    {historyModal.student.firstName} {historyModal.student.lastName} · {historyModal.student.srNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Profile summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-zinc-500">Base Fee</p>
                  <p className="font-bold text-sm text-zinc-200 font-mono">{formatCurrency(historyModal.baseMonthlyFee)}</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-zinc-500">Net Fee</p>
                  <p className="font-bold text-sm text-emerald-400 font-mono">{formatCurrency(historyModal.netMonthlyFee)}</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-zinc-500">Total Collected</p>
                  <p className="font-bold text-sm text-amber-400 font-mono">{formatCurrency(historyModal.totalCollected)}</p>
                </div>
              </div>

              {historyModal.payments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                  <Receipt className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400 font-bold">No payments recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="py-2 px-3 font-semibold">Receipt</th>
                        <th className="py-2 px-3 font-semibold">Month</th>
                        <th className="py-2 px-3 font-semibold">Inst. #</th>
                        <th className="py-2 px-3 font-semibold">Paid</th>
                        <th className="py-2 px-3 font-semibold">Fine</th>
                        <th className="py-2 px-3 font-semibold">Total</th>
                        <th className="py-2 px-3 font-semibold">Mode</th>
                        <th className="py-2 px-3 font-semibold">By</th>
                        <th className="py-2 px-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {historyModal.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-emerald-400 text-[11px]">{p.receiptNumber}</td>
                          <td className="py-2 px-3 text-zinc-300">{p.monthCovered}</td>
                          <td className="py-2 px-3 text-zinc-400 text-center">{p.installmentNumber}</td>
                          <td className="py-2 px-3 font-mono text-zinc-200">{formatCurrency(p.installmentPaid)}</td>
                          <td className="py-2 px-3 font-mono text-red-400">{p.lateFeeFine > 0 ? formatCurrency(p.lateFeeFine) : "—"}</td>
                          <td className="py-2 px-3 font-mono font-bold text-zinc-100">{formatCurrency(p.totalPaid)}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">{p.modeOfPayment}</span>
                          </td>
                          <td className="py-2 px-3 text-zinc-400">{p.paymentReceivedBy}</td>
                          <td className="py-2 px-3 text-zinc-500 font-mono text-[11px]">{formatDate(p.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <button onClick={() => setHistoryModal(null)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-700 bg-zinc-900 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
