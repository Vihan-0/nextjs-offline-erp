"use client";

import React, { useState } from "react";
import { History } from "lucide-react";
import { AddHistoricalSessionModal } from "./AddHistoricalSessionModal";

interface Props {
  srNumber: string;
}

export function AddHistoricalSessionButton({ srNumber }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-amber-500 border border-zinc-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
      >
        <History className="w-3 h-3" />
        <span>Add Past Session</span>
      </button>

      <AddHistoricalSessionModal
        srNumber={srNumber}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
