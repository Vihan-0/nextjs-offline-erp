"use client";

import React, { useState, useTransition } from "react";
import { stageHistoricalSessionAction } from "@/actions/historical";
import { X, CheckCircle2, AlertCircle, History, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { MASTER_CLASS_HIERARCHY } from "@/lib/classHierarchy";

interface AddHistoricalSessionModalProps {
  srNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddHistoricalSessionModal({
  srNumber,
  isOpen,
  onClose,
}: AddHistoricalSessionModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sessionYear, setSessionYear] = useState("2022-2023");
  const [className, setClassName] = useState<string>(MASTER_CLASS_HIERARCHY[0]);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("sessionYear", sessionYear);
    formData.append("className", className);

    startTransition(async () => {
      const res = await stageHistoricalSessionAction(srNumber, formData);
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Session added." });
        setTimeout(() => {
          onClose();
          setFeedback(null);
          router.refresh();
        }, 2000);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to add session." });
      }
    });
  };

  // Generate some common past session options
  const sessionOptions = [
    "2020-2021",
    "2021-2022",
    "2022-2023",
    "2023-2024",
    "2024-2025",
    "2025-2026",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 w-full max-w-md rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <History className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif">Add Past Session</h2>
              <p className="text-xs text-zinc-400 font-medium font-mono">
                Historical records for {srNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-100 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-xl border text-sm font-bold flex items-start gap-3 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p>{feedback.message}</p>
            </div>
          )}

          <div className="mb-6 p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 text-blue-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-blue-400" />
            <p>
              Adding a historical session allows you to maintain past report cards and accumulative registers. 
              <br /><br />
              <strong>Note:</strong> If you are not logged in as the Director, this action will require Maker-Checker approval.
            </p>
          </div>

          <form id="historical-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Academic Session Year
              </label>
              <select
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {sessionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Class
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {MASTER_CLASS_HIERARCHY.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="historical-form"
            disabled={isPending}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Add Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
