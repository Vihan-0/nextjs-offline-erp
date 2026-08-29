"use client";

import React, { useState, useRef, useTransition } from "react";
import { MessageSquare, Save, Loader2, CheckCircle2, AlertCircle, Pencil, X } from "lucide-react";
import { updateStudentGeneralRemark } from "@/actions/tcActions";

interface GeneralRemarkProps {
  srNumber: string;
  initialRemark?: string | null;
}

export function GeneralRemarkSection({ srNumber, initialRemark }: GeneralRemarkProps) {
  const [remark, setRemark] = useState(initialRemark || "");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = () => {
    setEditing(true);
    setStatus(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setRemark(initialRemark || "");
    setEditing(false);
    setStatus(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateStudentGeneralRemark(srNumber, remark);
      if (res.success) {
        setStatus({ ok: true, msg: "Remark saved successfully." });
        setEditing(false);
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ ok: false, msg: res.error || "Failed to save remark." });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-800/60">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 tracking-wide uppercase">General Remark</h3>
            <p className="text-[10px] text-zinc-500">Administrative / behavioral notes</p>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white border border-amber-500 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            placeholder="Enter administrative or behavioral remarks for this student…"
            className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500/70 resize-none placeholder:text-zinc-600 transition-colors"
          />
        ) : (
          <div
            className="min-h-[4rem] cursor-pointer group"
            onClick={handleEdit}
            title="Click to edit remark"
          >
            {remark ? (
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{remark}</p>
            ) : (
              <p className="text-sm text-zinc-600 italic flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                No remark added yet — click to add a note.
              </p>
            )}
          </div>
        )}

        {/* Status toast */}
        {status && (
          <div
            className={`mt-3 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border ${
              status.ok
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                : "bg-red-950/60 text-red-400 border-red-800/60"
            }`}
          >
            {status.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}
