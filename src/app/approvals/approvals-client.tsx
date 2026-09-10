"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { approveEditRequest, rejectEditRequest } from "@/actions/editRequestActions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditRequest = any;

interface ApprovalsClientProps {
  requests: EditRequest[];
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  bloodGroup: "Blood Group",
  distanceFromSchool: "Distance from School (km)",
  religion: "Religion",
  category: "Category",
  nationality: "Nationality",
  medicalConditions: "Medical Conditions",
  allergies: "Allergies",
  currentAddress: "Current Address",
  permanentAddress: "Permanent Address",
  aadharNumber: "Aadhaar Number",
  motherIncome: "Mother's Income (₹)",
  fatherName: "Father's Name",
  fatherPhone: "Father's Phone",
  fatherOccupation: "Father's Occupation",
  fatherEducation: "Father's Qualification",
  fatherIncome: "Father's Income (₹)",
  motherName: "Mother's Name",
  motherPhone: "Mother's Phone",
  motherOccupation: "Mother's Occupation",
  motherEducation: "Mother's Qualification",
  address: "Residential Address",
  className: "Class",
  sessionYear: "Session Year",
};

function getExistingValue(student: EditRequest["student"], key: string): string {
  // Direct student fields
  const directMap: Record<string, string> = {
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-IN") : "",
    gender: student.gender || "",
    bloodGroup: student.bloodGroup || "",
    distanceFromSchool: student.distanceFromSchool?.toString() || "",
    religion: student.religion || "",
    category: student.category || "",
    nationality: student.nationality || "",
    medicalConditions: student.medicalConditions || "",
    allergies: student.allergies || "",
    currentAddress: student.currentAddress || "",
    permanentAddress: student.permanentAddress || "",
    aadharNumber: student.aadharNumber ? "••••-••••-••••" : "",
    motherIncome: student.motherIncome?.toString() || "",
  };

  if (directMap[key] !== undefined) return directMap[key];

  // Parent fields
  const father = student.parents?.find(
    (p: { relationType: string }) => p.relationType?.toLowerCase() === "father"
  );
  const mother = student.parents?.find(
    (p: { relationType: string }) => p.relationType?.toLowerCase() === "mother"
  );

  const parentMap: Record<string, string> = {
    fatherName: father ? `${father.firstName} ${father.lastName}`.trim() : "",
    fatherPhone: father?.phoneNumber || "",
    fatherOccupation: father?.occupation || "",
    fatherEducation: father?.educationQualification || "",
    fatherIncome: father?.annualIncome?.toString() || "",
    motherName: mother ? `${mother.firstName} ${mother.lastName}`.trim() : "",
    motherPhone: mother?.phoneNumber || "",
    motherOccupation: mother?.occupation || "",
    motherEducation: mother?.educationQualification || "",
    address: father?.address || mother?.address || "",
  };

  if (parentMap[key] !== undefined) return parentMap[key];

  // Academic
  const latestSession = student.academicSessions?.[0];
  if (key === "className") return latestSession?.className || "";
  if (key === "sessionYear") return latestSession?.sessionYear || "";

  return "";
}

export function ApprovalsClient({ requests }: ApprovalsClientProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    setStatusMsg(null);
    const res = await approveEditRequest(requestId);
    setProcessing(null);
    setStatusMsg({ id: requestId, success: res.success, message: res.success ? res.message || "Approved" : res.error || "Failed" });
    if (res.success) {
      setTimeout(() => router.refresh(), 1500);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    setStatusMsg(null);
    const reason = rejectReason[requestId] || undefined;
    const res = await rejectEditRequest(requestId, reason);
    setProcessing(null);
    setStatusMsg({ id: requestId, success: res.success, message: res.success ? res.message || "Rejected" : res.error || "Failed" });
    if (res.success) {
      setShowRejectInput(null);
      setTimeout(() => router.refresh(), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Scholar Edit Approval Desk</h1>
          <p className="text-xs text-zinc-400">
            Review proposed changes from Staff Faculty. Approve to apply to live records, or reject to discard.
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <Clock className="w-3.5 h-3.5" />
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/60 rounded-3xl border border-zinc-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <p className="text-zinc-400 font-bold">No Pending Edit Requests</p>
          <p className="text-xs text-zinc-500 mt-1">All staff-submitted changes have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: EditRequest) => {
            const proposed = JSON.parse(req.proposedData || "{}");
            const attachedFiles: { fieldName: string; tempPath: string }[] = req.attachedFiles
              ? JSON.parse(req.attachedFiles)
              : [];
            const isExpanded = expandedId === req.id;
            const isProcessing = processing === req.id;
            const hasStatus = statusMsg && statusMsg.id === req.id;
            const studentName = `${req.student.firstName} ${req.student.lastName}`.trim();

            // Find fields that differ
            const changedFields = Object.keys(proposed).filter((key) => {
              if (!FIELD_LABELS[key]) return false;
              const existingVal = getExistingValue(req.student, key);
              const proposedVal = proposed[key]?.toString() || "";
              return proposedVal && existingVal !== proposedVal;
            });

            return (
              <div
                key={req.id}
                className="bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg"
              >
                {/* Collapsed Header Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40 shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-100 uppercase">{studentName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                        {req.studentSrNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {changedFields.length} field{changedFields.length !== 1 ? "s" : ""} modified
                      {attachedFiles.length > 0 ? ` • ${attachedFiles.length} file${attachedFiles.length !== 1 ? "s" : ""}` : ""}
                      {" • "}Submitted by {req.submittedBy || "Staff"} on {new Date(req.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />
                  )}
                </button>

                {/* Expanded Diff View */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-zinc-800/60 space-y-4 pt-4">
                    {/* Diff Table */}
                    <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                      <div className="grid grid-cols-3 gap-0 text-[10px] font-mono uppercase text-zinc-500 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                        <span>Field</span>
                        <span>Current (Live)</span>
                        <span>Proposed (New)</span>
                      </div>
                      <div className="divide-y divide-zinc-800/40">
                        {changedFields.map((key) => {
                          const existingVal = getExistingValue(req.student, key);
                          const proposedVal = proposed[key]?.toString() || "";
                          const isChanged = existingVal !== proposedVal;

                          return (
                            <div
                              key={key}
                              className={`grid grid-cols-3 gap-0 px-4 py-2.5 text-xs ${
                                isChanged ? "bg-amber-950/10" : ""
                              }`}
                            >
                              <span className="font-bold text-zinc-300">
                                {FIELD_LABELS[key] || key}
                              </span>
                              <span className="text-zinc-500 font-mono break-all">
                                {existingVal || "—"}
                              </span>
                              <span className={`font-mono break-all ${isChanged ? "text-emerald-400 font-bold" : "text-zinc-400"}`}>
                                {proposedVal || "—"}
                                {isChanged && (
                                  <ArrowRight className="inline w-3 h-3 text-emerald-500 ml-1" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                      <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-2">
                        <h4 className="text-[11px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Attached File Enclosures (Staged in /temp/)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {attachedFiles.map((af: { fieldName: string; tempPath: string }, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-700"
                            >
                              {af.fieldName}: {af.tempPath}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Message */}
                    {hasStatus && (
                      <div
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${
                          statusMsg.success
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                            : "bg-red-950/60 text-red-300 border border-red-800/60"
                        }`}
                      >
                        {statusMsg.success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {statusMsg.message}
                      </div>
                    )}

                    {/* Reject Reason Input */}
                    {showRejectInput === req.id && (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason[req.id] || ""}
                          onChange={(e) =>
                            setRejectReason((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="Optional rejection reason..."
                          rows={2}
                          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-800 placeholder-zinc-600"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Approve & Apply to Live Record
                      </button>

                      {showRejectInput === req.id ? (
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Confirm Rejection
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(req.id)}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-red-300 border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
