"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Home,
  FileCheck2,
  Lock,
  Sparkles,
} from "lucide-react";

export default function PublicVerificationLookupPage() {
  const [traceInput, setTraceInput] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceInput.trim()) return;
    const cleanCode = traceInput.trim().toUpperCase();
    router.push(`/verify/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans vector-grid-lines">
      {/* Sub Header */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <Home className="w-4 h-4 text-zinc-400" />
              <span>Portal</span>
            </Link>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
              SEC-TRACE-GATEWAY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              CBSE & State Board Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center w-full">
        <div className="w-full bg-zinc-900/90 rounded-3xl border border-zinc-800 p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Vector Accent */}
          <span className="absolute top-4 right-4 text-zinc-700 font-mono text-xs select-none">+</span>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-950/60 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-800/60 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 font-serif">
              Official Document Verification
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Town Hall Public High School Public Cryptographic Verification System. Verify official Transfer Certificates, Progress Report Cards, and Scholar Registers.
            </p>
          </div>

          {/* Verification Code Form */}
          <form onSubmit={handleSearch} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-zinc-300">
                Enter 8-Character Cryptographic Trace Code:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={traceInput}
                  onChange={(e) => setTraceInput(e.target.value)}
                  placeholder="e.g. TC-8F92A1B3 or RC-4C29F01A"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-mono text-sm sm:text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 uppercase placeholder:normal-case placeholder:text-zinc-600 transition-all"
                  required
                />
                <Search className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-500">
                The trace code is printed at the bottom and within the QR code of every official certificate or mark sheet.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <span>Verify Official Digital Twin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Guarantee Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Immutable Ledger</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Anti-Forgery Check</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Instant Digital Twin</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        Town Hall Public High School • Official Institutional Records & Document Verification Engine v2.4
      </footer>
    </div>
  );
}
