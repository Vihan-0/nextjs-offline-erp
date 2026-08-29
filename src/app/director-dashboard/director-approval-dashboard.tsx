"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Check,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  FileText,
  User,
  Phone,
  Home,
  HeartPulse,
  LogOut,
  History,
  Award,
  Trash2,
  AlertTriangle,
  GraduationCap,
  FileSpreadsheet,
  CheckCheck,
  ExternalLink,
  CreditCard,
  X,
} from "lucide-react";
import {
  approveStudents,
  rejectStudent,
  approveStudentDeletion,
  rejectStudentDeletion,
  approveMarksSubmission,
} from "@/actions/approvals";
import { logoutDirector } from "@/actions/auth";
import { getEnclosureUrl } from "@/lib/enclosures";

export interface PendingStudentItem {
  id: string;
  srNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  religion: string | null;
  category: string | null;
  nationality: string | null;
  photoPath: string | null;
  birthCertificatePath: string | null;
  aadharCardPath: string | null;
  transferCertificatePath: string | null;
  parentPanCardPath?: string | null;
  fatherPhotoPath?: string | null;
  motherPhotoPath?: string | null;
  parentPhotoPath?: string | null;
  medicalConditions: string | null;
  allergies: string | null;
  createdAt: string;
  apaarId: string | null;
  recordStatus: string;
  className: string;
  sessionYear: string;
  fatherName: string;
  fatherPhone: string | null;
  fatherOccupation: string | null;
  motherName: string;
  motherPhone: string | null;
  motherOccupation: string | null;
  address: string | null;
}

export interface PendingDeletionItem extends PendingStudentItem {
  requestedAt?: string;
}

export interface AuditLedgerItem {
  id: string;
  actionType: string;
  studentSrNumber: string;
  traceCode: string;
  details: string | null;
  timestamp: string;
  studentName?: string;
}

interface DirectorApprovalDashboardProps {
  initialStudents: PendingStudentItem[];
  pendingDeletions?: PendingDeletionItem[];
  stats: {
    pendingAdmissionsCount: number;
    pendingDeletionsCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
  recentAuditLogs?: AuditLedgerItem[];
}

export function DirectorApprovalDashboard({
  initialStudents,
  pendingDeletions = [],
  stats,
  recentAuditLogs = [],
}: DirectorApprovalDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"admissions" | "deletions" | "marks" | "audit">("admissions");

  // Admissions state
  const [students, setStudents] = useState<PendingStudentItem[]>(initialStudents);
  const [selectedSrs, setSelectedSrs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [expandedSr, setExpandedSr] = useState<string | null>(null);

  // Deletions state
  const [deletions, setDeletions] = useState<PendingDeletionItem[]>(pendingDeletions);
  const [deletionTarget, setDeletionTarget] = useState<PendingDeletionItem | null>(null);

  // Audit search
  const [auditSearch, setAuditSearch] = useState("");

  // Local set of log IDs that have been signed off (to immediately clear them from queue)
  const [signedOffIds, setSignedOffIds] = useState<Set<string>>(new Set());

  // Status feedback toast
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Rejection modal state for admissions
  const [rejectingStudent, setRejectingStudent] = useState<PendingStudentItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Document Lightbox / Viewer Modal state
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; isImage: boolean } | null>(null);

  // Sync state if props change from server revalidation
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  React.useEffect(() => {
    setDeletions(pendingDeletions);
  }, [pendingDeletions]);

  // Extract unique classes for admission filtering
  const availableClasses = useMemo(() => {
    const classes = new Set(students.map((s) => s.className).filter(Boolean));
    return ["All", ...Array.from(classes)].sort();
  }, [students]);

  // Filter pending admissions
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.srNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass =
        classFilter === "All" || student.className === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, classFilter]);

  // Extract marks and report card submissions from audit logs (excluding already-signed-off entries)
  const marksSubmissions = useMemo(() => {
    return recentAuditLogs.filter((log) => {
      if (log.actionType !== "MARKS_SUBMITTED" && log.actionType !== "REPORT_CARD_MODIFIED") {
        return false;
      }
      if (signedOffIds.has(log.id)) return false;
      if (log.details) {
        try {
          const parsed = JSON.parse(log.details);
          if (parsed.certified === true || parsed.status === "APPROVED_BY_DIRECTOR") {
            return false;
          }
        } catch {
          // ignore
        }
      }
      return true;
    });
  }, [recentAuditLogs, signedOffIds]);

  // Filter audit logs based on search
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return recentAuditLogs;
    const q = auditSearch.toLowerCase();
    return recentAuditLogs.filter(
      (log) =>
        log.studentSrNumber.toLowerCase().includes(q) ||
        log.traceCode.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q) ||
        (log.studentName && log.studentName.toLowerCase().includes(q))
    );
  }, [recentAuditLogs, auditSearch]);

  // Admission selection handlers
  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedSrs.includes(s.srNumber));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSrSet = new Set(filteredStudents.map((s) => s.srNumber));
      setSelectedSrs((prev) => prev.filter((sr) => !filteredSrSet.has(sr)));
    } else {
      const combined = new Set([...selectedSrs, ...filteredStudents.map((s) => s.srNumber)]);
      setSelectedSrs(Array.from(combined));
    }
  };

  const toggleSelectRow = (srNumber: string) => {
    setSelectedSrs((prev) =>
      prev.includes(srNumber) ? prev.filter((s) => s !== srNumber) : [...prev, srNumber]
    );
  };

  // Bulk Approval Handler
  const handleBulkApprove = () => {
    if (selectedSrs.length === 0) return;

    const count = selectedSrs.length;
    startTransition(async () => {
      try {
        const res = await approveStudents(selectedSrs);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Successfully approved ${count} student ${count === 1 ? "record" : "records"}.`,
          });
          setStudents((prev) => prev.filter((s) => !selectedSrs.includes(s.srNumber)));
          setSelectedSrs([]);
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Approval failed. Please try again.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      }
    });
  };

  // Single Direct Approval Handler
  const handleSingleApprove = (student: PendingStudentItem) => {
    startTransition(async () => {
      try {
        const res = await approveStudents([student.srNumber]);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Student ${student.fullName} (${student.srNumber}) has been approved.`,
          });
          setStudents((prev) => prev.filter((s) => s.srNumber !== student.srNumber));
          setSelectedSrs((prev) => prev.filter((s) => s !== student.srNumber));
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Approval failed.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to approve student.",
        });
      }
    });
  };

  // Targeted Rejection Confirmation
  const confirmReject = () => {
    if (!rejectingStudent) return;
    const target = rejectingStudent;
    const reason = rejectionReason.trim();

    startTransition(async () => {
      try {
        const res = await rejectStudent(target.srNumber, reason);
        if (res.success) {
          setFeedback({
            type: "info",
            message: `Record ${target.srNumber} (${target.fullName}) marked as REJECTED.`,
          });
          setStudents((prev) => prev.filter((s) => s.srNumber !== target.srNumber));
          setSelectedSrs((prev) => prev.filter((s) => s !== target.srNumber));
          setRejectingStudent(null);
          setRejectionReason("");
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Rejection failed.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to reject record.",
        });
      }
    });
  };

  // Approve Permanent Deletion Handler
  const handleApproveDeletion = (student: PendingDeletionItem) => {
    startTransition(async () => {
      try {
        const res = await approveStudentDeletion(student.srNumber);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Scholar "${student.srNumber}" (${student.fullName}) permanently deleted from database.`,
          });
          setDeletions((prev) => prev.filter((d) => d.srNumber !== student.srNumber));
          setDeletionTarget(null);
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Failed to delete student.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to execute deletion.",
        });
      }
    });
  };

  // Reject / Cancel Deletion Handler
  const handleRejectDeletion = (student: PendingDeletionItem) => {
    startTransition(async () => {
      try {
        const res = await rejectStudentDeletion(student.srNumber);
        if (res.success) {
          setFeedback({
            type: "info",
            message: `Deletion request rejected. Scholar "${student.srNumber}" (${student.fullName}) restored to Active status.`,
          });
          setDeletions((prev) => prev.filter((d) => d.srNumber !== student.srNumber));
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Failed to restore student.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to restore record.",
        });
      }
    });
  };

  // Marks Sign-Off Handler
  const handleSignOffMarks = (log: AuditLedgerItem) => {
    let detailsObj: { className?: string; sessionYear?: string; studentsUpdatedCount?: number } = {};
    try {
      if (log.details) {
        detailsObj = JSON.parse(log.details);
      }
    } catch {
      // ignore
    }

    // Immediately remove from UI queue
    setSignedOffIds((prev) => new Set([...prev, log.id]));

    startTransition(async () => {
      try {
        const res = await approveMarksSubmission({
          auditLogId: log.id,
          studentSrNumber: log.studentSrNumber,
          className: detailsObj.className || "Class",
          sessionYear: detailsObj.sessionYear || "2026-2027",
          studentCount: detailsObj.studentsUpdatedCount || 1,
        });

        if (res.success) {
          setFeedback({
            type: "success",
            message: res.message || "Marks certified and signed off by Director.",
          });
          router.refresh();
        } else {
          setSignedOffIds((prev) => {
            const next = new Set(prev);
            next.delete(log.id);
            return next;
          });
          setFeedback({
            type: "error",
            message: res.error || "Failed to sign off marks.",
          });
        }
      } catch (err: unknown) {
        setSignedOffIds((prev) => {
          const next = new Set(prev);
          next.delete(log.id);
          return next;
        });
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to sign off marks.",
        });
      }
    });
  };

  // Director Logout Handler
  const handleLogout = () => {
    startTransition(async () => {
      await logoutDirector();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Executive Header Bar */}
      <header className="bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs shrink-0 border border-stone-800">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-serif">
                  Director's Executive Governance Desk
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Maker-Checker Protocol
                </span>
              </div>
              <p className="text-xs text-stone-500 font-serif italic">
                Town Hall Public High School • Master Clearance for Admissions, Deletions, Marks & Cryptographic Trace Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 shadow-xs transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-stone-700" />
              <span>Home</span>
            </Link>
            <button
              onClick={() => router.refresh()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 rounded-lg border border-stone-300 shadow-xs transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Full Directory</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Lock Terminal & Clear Director Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Lock / Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Executive Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Card 1: Pending Admissions */}
          <button
            type="button"
            onClick={() => setActiveTab("admissions")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === "admissions"
                ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-sm"
                : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-700" />
                Admissions Queue
              </span>
              <span className="text-xl font-black text-amber-900 font-mono">
                {students.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              New admissions awaiting executive Maker-Checker sign-off.
            </p>
          </button>

          {/* Card 2: Pending Deletions */}
          <button
            type="button"
            onClick={() => setActiveTab("deletions")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === "deletions"
                ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/40 shadow-sm"
                : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-700" />
                Deletion Requests
              </span>
              <span className="text-xl font-black text-rose-900 font-mono">
                {deletions.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Scholars marked for deletion requiring Director confirmation.
            </p>
          </button>

          {/* Card 3: Marks Submissions */}
          <button
            type="button"
            onClick={() => setActiveTab("marks")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === "marks"
                ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/40 shadow-sm"
                : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                Marks & Registers
              </span>
              <span className="text-xl font-black text-blue-900 font-mono">
                {marksSubmissions.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Class marks entries submitted for official Director sign-off.
            </p>
          </button>

          {/* Card 4: Universal Audit Stream */}
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-sm"
                : "bg-white border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-700" />
                Universal Ledger
              </span>
              <span className="text-xl font-black text-emerald-900 font-mono">
                {recentAuditLogs.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Real-time cryptographic audit log of all institutional actions.
            </p>
          </button>

        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : feedback.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-300"
                : "bg-blue-50 text-blue-900 border-blue-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {feedback.type === "error" && <XCircle className="w-4 h-4 text-rose-600" />}
              {feedback.type === "info" && <AlertCircle className="w-4 h-4 text-blue-600" />}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-stone-500 hover:text-stone-800 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PENDING ADMISSIONS QUEUE                                           */}
        {/* ========================================================================= */}
        {activeTab === "admissions" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
            
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-stone-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search pending admission by name, SR no, father..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-stone-500" />
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-white border border-stone-200 text-stone-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls === "All" ? "All Classes" : `Class: ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSrs.length > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Approve Selected ({selectedSrs.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100/70 text-stone-600 font-mono uppercase text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">SR No.</th>
                    <th className="px-4 py-3">Scholar Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Father / Guardian</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Applied Date</th>
                    <th className="px-4 py-3 text-right">Clearance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-stone-500">
                        <GraduationCap className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="font-bold text-stone-700">No pending admissions in queue</p>
                        <p className="text-[11px] text-stone-400">All submitted admissions have been verified and processed.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedSrs.includes(student.srNumber);
                      const isExpanded = expandedSr === student.srNumber;

                      return (
                        <React.Fragment key={student.id}>
                          <tr
                            className={`hover:bg-amber-50/40 transition-colors ${
                              isSelected ? "bg-amber-50/60" : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(student.srNumber)}
                                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-amber-700">
                              {student.srNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 text-stone-500 font-bold text-[11px]">
                                  {student.photoPath ? (
                                    <img
                                      src={getEnclosureUrl(student.photoPath)}
                                      alt={student.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    student.fullName.charAt(0)
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900 uppercase font-serif">
                                    {student.fullName}
                                  </span>
                                  {student.recordStatus === "PENDING_UPDATE" && (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                      Profile Edit
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] border border-stone-200">
                                {student.className}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-700 uppercase">
                              {student.fatherName || "—"}
                            </td>
                            <td className="px-4 py-3 font-mono text-stone-600">
                              {student.fatherPhone || "—"}
                            </td>
                            <td className="px-4 py-3 text-stone-500 text-[11px]">
                              {student.createdAt}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSr(isExpanded ? null : student.srNumber)
                                  }
                                  className="p-1.5 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                                  title="Expand Dossier Details"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSingleApprove(student)}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Approve Scholar Admission"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingStudent(student);
                                    setRejectionReason("");
                                  }}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Reject Admission"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Preview Drawer */}
                          {isExpanded && (
                            <tr className="bg-stone-50/80 border-b border-stone-200">
                              <td colSpan={8} className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  {/* Demographics */}
                                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                                    <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] font-mono border-b pb-1">
                                      Student Demographics
                                    </h4>
                                    <div className="space-y-1 text-stone-600">
                                      <div>DOB: <strong>{student.dateOfBirth}</strong></div>
                                      <div>Gender: <strong>{student.gender}</strong></div>
                                      <div>Blood Group: <strong>{student.bloodGroup || "—"}</strong></div>
                                      <div>Category / Religion: <strong>{student.category || "—"} / {student.religion || "—"}</strong></div>
                                      <div>Address: <strong>{student.address || "—"}</strong></div>
                                      {student.medicalConditions && (
                                        <div>Medical: <strong className="text-amber-700">{student.medicalConditions}</strong></div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Parent Info */}
                                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                                    <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] font-mono border-b pb-1">
                                      Parents & Guardians
                                    </h4>
                                    <div className="space-y-1 text-stone-600">
                                      <div>Father: <strong>{student.fatherName || "—"}</strong></div>
                                      <div>Father Phone: <strong>{student.fatherPhone || "—"}</strong></div>
                                      <div>Occupation: <strong>{student.fatherOccupation || "—"}</strong></div>
                                      <div>Mother: <strong>{student.motherName || "—"}</strong></div>
                                      <div>Mother Phone: <strong>{student.motherPhone || "—"}</strong></div>
                                    </div>
                                  </div>

                                  {/* Document Enclosures (Photos, Aadhaar, PAN, Birth Cert, TC) */}
                                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                                    <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] font-mono border-b pb-1 flex items-center justify-between">
                                      <span>Document & Photo Enclosures</span>
                                      <span className="text-[10px] text-stone-400 font-normal">Click to preview</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      {/* 1. Scholar Photo */}
                                      {student.photoPath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Scholar Photo — ${student.fullName}`,
                                              url: getEnclosureUrl(student.photoPath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                          <span className="truncate">Scholar Photo</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No Student Photo</span>
                                      )}

                                      {/* 2. Aadhaar Card */}
                                      {student.aadharCardPath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Aadhaar Card — ${student.fullName}`,
                                              url: getEnclosureUrl(student.aadharCardPath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                          <span className="truncate">Aadhaar Card</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No Aadhaar</span>
                                      )}

                                      {/* 3. Parent PAN Card */}
                                      {student.parentPanCardPath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Parent PAN Card — ${student.fatherName || student.fullName}`,
                                              url: getEnclosureUrl(student.parentPanCardPath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <CreditCard className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                          <span className="truncate">Parent PAN</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No PAN Card</span>
                                      )}

                                      {/* 4. Father's Photo */}
                                      {student.fatherPhotoPath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Father's Photograph — ${student.fatherName || student.fullName}`,
                                              url: getEnclosureUrl(student.fatherPhotoPath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <User className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                                          <span className="truncate">Father Photo</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No Father Photo</span>
                                      )}

                                      {/* 5. Mother's Photo */}
                                      {student.motherPhotoPath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Mother's Photograph — ${student.motherName || student.fullName}`,
                                              url: getEnclosureUrl(student.motherPhotoPath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-rose-900 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <User className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                                          <span className="truncate">Mother Photo</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No Mother Photo</span>
                                      )}

                                      {/* 6. Birth Certificate */}
                                      {student.birthCertificatePath ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Birth Certificate — ${student.fullName}`,
                                              url: getEnclosureUrl(student.birthCertificatePath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                          <span className="truncate">Birth Cert</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-stone-400 py-1">No Birth Cert</span>
                                      )}

                                      {/* 7. Transfer Certificate */}
                                      {student.transferCertificatePath && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewDoc({
                                              title: `Transfer Certificate — ${student.fullName}`,
                                              url: getEnclosureUrl(student.transferCertificatePath!),
                                              isImage: true,
                                            })
                                          }
                                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer text-left truncate"
                                        >
                                          <Award className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                          <span className="truncate">T.C.</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-100 text-xs text-stone-500 flex justify-between items-center bg-stone-50/50">
              <span>Showing {filteredStudents.length} of {students.length} pending admissions</span>
              <span className="font-mono text-[11px] text-stone-400">Town Hall Executive Governance</span>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PENDING DELETION REQUESTS QUEUE                                    */}
        {/* ========================================================================= */}
        {activeTab === "deletions" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
            
            <div className="p-5 border-b border-stone-100 bg-rose-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Maker-Checker Deletion Authorization Queue
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Staff cannot permanently delete student records directly. Each deletion request requires explicit Director approval.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                {deletions.length} Pending
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100/70 text-stone-600 font-mono uppercase text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3.5">SR No.</th>
                    <th className="px-5 py-3.5">Scholar Name</th>
                    <th className="px-5 py-3.5">Class</th>
                    <th className="px-5 py-3.5">Father's Name</th>
                    <th className="px-5 py-3.5">Requested At</th>
                    <th className="px-5 py-3.5 text-right">Director Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {deletions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-stone-500">
                        <Trash2 className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                        <p className="font-bold text-stone-700">No deletion requests pending</p>
                        <p className="text-[11px] text-stone-400">All student records are active and cleared.</p>
                      </td>
                    </tr>
                  ) : (
                    deletions.map((student) => (
                      <tr key={student.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-rose-700">
                          {student.srNumber}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-stone-900 uppercase font-serif">
                          {student.fullName}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] border border-stone-200">
                            {student.className}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600 uppercase">
                          {student.fatherName || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-stone-500 text-[11px]">
                          {student.requestedAt || student.createdAt}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectDeletion(student)}
                              disabled={isPending}
                              className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Reject Deletion and Restore Student to Active"
                            >
                              Restore / Keep Record
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletionTarget(student)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                              title="Permanently Authorize Deletion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Authorize Deletion</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MARKS & EXAMINATION SIGN-OFF                                       */}
        {/* ========================================================================= */}
        {activeTab === "marks" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
            
            <div className="p-5 border-b border-stone-100 bg-blue-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  Examination & Marks Register Sign-Off Queue
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Review submitted class exam registers, attendance tallies, and soft skill evaluations before official certification.
                </p>
              </div>
              <Link
                href="/registers/data-entry"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
              >
                <span>Open Marks Ledger</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* List */}
            <div className="p-5 space-y-3">
              {marksSubmissions.length === 0 ? (
                <div className="text-center py-16 text-stone-500">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-bold text-stone-700">No marks submissions pending review</p>
                  <p className="text-[11px] text-stone-400">All student marks entered in the Marks Register are logged in the Universal Ledger.</p>
                </div>
              ) : (
                marksSubmissions.map((log) => {
                  let detailsObj: {
                    className?: string;
                    sessionYear?: string;
                    studentsUpdatedCount?: number;
                    teacherRemark?: string;
                    rankInClass?: string;
                  } = {};
                  try {
                    if (log.details) detailsObj = JSON.parse(log.details);
                  } catch {
                    // ignore
                  }

                  const isReportCard = log.actionType === "REPORT_CARD_MODIFIED";

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isReportCard ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold">
                              Report Card Revision
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10.5px] font-bold font-mono">
                              {detailsObj.studentsUpdatedCount || 1} Scholars Submitted
                            </span>
                          )}
                          <span className="font-bold text-stone-900 text-sm">
                            {isReportCard ? `Scholar S.R: ${log.studentSrNumber}` : (detailsObj.className || "Class")} • {detailsObj.sessionYear || "2026-2027"}
                          </span>
                          <span className="font-mono text-[11px] text-stone-400">
                            {log.traceCode}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {isReportCard
                            ? `Class: ${detailsObj.className || "Class"} • Remark: "${detailsObj.teacherRemark || "Faculty edit"}" • Rank: ${detailsObj.rankInClass || "—"}`
                            : `Class marks register submitted for ${detailsObj.className || "Class"}`}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Submitted on {new Date(log.timestamp).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isReportCard && (
                          <Link
                            href={`/students/${encodeURIComponent(log.studentSrNumber)}`}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Scholar</span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSignOffMarks(log)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isReportCard ? "Approve & Certify Report Card" : "Director Sign-Off & Certify"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: UNIVERSAL ACTIVITY & AUDIT LEDGER                                  */}
        {/* ========================================================================= */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
            
            <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-stone-50/50">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Universal Institutional Activity Ledger
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Complete immutable chronological stream of every admission, deletion, mark edit, and print authorization.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter by trace code, action, or scholar..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-stone-100/70 text-stone-600 font-mono uppercase text-[11px] border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3.5">Trace Code</th>
                    <th className="px-5 py-3.5">Action Type</th>
                    <th className="px-5 py-3.5">Scholar</th>
                    <th className="px-5 py-3.5">Details</th>
                    <th className="px-5 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-stone-500">
                        No activity records found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      let badgeColor = "bg-stone-100 text-stone-700 border-stone-200";
                      if (log.actionType.includes("APPROVAL") || log.actionType.includes("OK")) {
                        badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      } else if (log.actionType.includes("DELETION") || log.actionType.includes("REJECT")) {
                        badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
                      } else if (log.actionType.includes("ADMISSION") || log.actionType.includes("SUBMITTED")) {
                        badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                      } else if (log.actionType.includes("PRINT")) {
                        badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                      }

                      return (
                        <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-stone-700">
                            {log.traceCode}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] font-bold border ${badgeColor}`}>
                              {log.actionType}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-stone-900 uppercase">
                              {log.studentName || log.studentSrNumber}
                            </span>
                            <span className="text-stone-400 font-mono text-[11px] block">
                              {log.studentSrNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-stone-600 max-w-xs truncate text-[11px]">
                            {log.details || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-stone-500 text-[11px]">
                            {new Date(log.timestamp).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>

      {/* Confirmation Modal for Permanent Deletion */}
      {deletionTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700 border-b border-stone-100 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Director Deletion Clearance
                </h3>
                <p className="text-xs text-stone-500">Executive Confirmation Required</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-700">
              <p>
                As Director, you are authorizing the permanent deletion of scholar:
              </p>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 font-mono">
                <div className="font-bold text-stone-900">{deletionTarget.fullName}</div>
                <div className="text-amber-700">S.R. Number: {deletionTarget.srNumber}</div>
                <div className="text-stone-500">Class: {deletionTarget.className}</div>
              </div>
              <p className="text-rose-700 font-semibold text-[11px]">
                ⚠️ This will permanently remove the scholar register folio, marks ledger records, and parent profiles from SQLite.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletionTarget(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveDeletion(deletionTarget)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {isPending ? "Executing Deletion..." : "Confirm & Authorize Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admission Rejection Modal */}
      {rejectingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700 border-b border-stone-100 pb-3">
              <XCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Reject Admission
                </h3>
                <p className="text-xs text-stone-500">Maker-Checker Rejection Notice</p>
              </div>
            </div>

            <p className="text-xs text-stone-700">
              Provide a reason for rejecting scholar <strong>{rejectingStudent.fullName}</strong> ({rejectingStudent.srNumber}):
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Incomplete document verification or address discrepancy..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingStudent(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Document & Photo Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-zinc-950 rounded-3xl border border-zinc-800 p-5 space-y-4 shadow-2xl text-stone-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold truncate max-w-md">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-stone-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full View</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80 min-h-[300px]">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-lg"
                onError={(e) => {
                  // Fallback for PDF or unsupported format
                  (e.target as HTMLElement).style.display = "none";
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden flex-col items-center justify-center p-8 text-center space-y-3">
                <FileText className="w-12 h-12 text-stone-500" />
                <p className="text-xs text-stone-400">
                  This document enclosure is ready for authenticated viewing.
                </p>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Open Enclosure in New Window
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
