"use client";

import React, { useState } from "react";
import { Edit3, UserCheck } from "lucide-react";
import { EditStudentModal, StudentEditData } from "./EditStudentModal";

interface EditStudentProfileButtonProps {
  student: StudentEditData;
  className?: string;
  variant?: "primary" | "secondary" | "pill";
}

export function EditStudentProfileButton({
  student,
  className = "",
  variant = "primary",
}: EditStudentProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonStyles = {
    primary:
      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-all cursor-pointer",
    secondary:
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer",
    pill:
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 transition-colors cursor-pointer",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${buttonStyles[variant]} ${className}`}
        title="Edit Scholar Name & Profile Details"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Edit Details</span>
      </button>

      {isOpen && (
        <EditStudentModal
          student={student}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
