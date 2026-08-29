"use client";

import React, { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
  Home,
  Loader2,
} from "lucide-react";
import { loginDirector } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/director-dashboard";

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Please enter the Director Master PIN.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const res = await loginDirector(pin);
        if (res.success) {
          setIsSuccess(true);
          // Immediate navigation to destination
          setTimeout(() => {
            router.push(redirectTarget);
            router.refresh();
          }, 300);
        } else {
          setError(res.error || "Access Denied. Invalid Master PIN.");
          setPin("");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected authentication error occurred."
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950 relative overflow-hidden font-sans">
      {/* Subtle Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors bg-stone-900/80 px-3.5 py-1.5 rounded-full border border-stone-800 backdrop-blur-xs"
        >
          <Home className="w-3.5 h-3.5 text-stone-400" />
          <span>Public Portal</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>GOVERNANCE SYSTEM v2.4</span>
        </div>
      </header>

      {/* Main Access Panel Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Access Card */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
            {/* School Emblem & Header */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-stone-950 border-2 border-stone-700/80 flex items-center justify-center shadow-inner relative overflow-hidden group">
                <Image
                  src="/thphslogo.jpeg"
                  alt="Town Hall Public High School"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Executive Terminal
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-serif">
                  Director's Access
                </h1>
                <p className="text-xs text-stone-400 font-serif italic mt-0.5">
                  Town Hall Public High School • Scholar Register Clearance
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success State */}
            {isSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verification successful. Authorizing executive session...</span>
              </div>
            )}

            {/* PIN Entry Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="director-pin"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Master Key / PIN
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Confidential
                  </span>
                </label>

                <div className="relative">
                  <input
                    id="director-pin"
                    type={showPin ? "text" : "password"}
                    autoComplete="current-password"
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter Director Master PIN"
                    disabled={isPending || isSuccess}
                    className="w-full px-4 py-3.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-600 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isPending || isSuccess || !pin.trim()}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Session Established</span>
                  </>
                ) : (
                  <>
                    <span>Authorize Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Badges & Footer */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>HMAC-Signed Session</span>
              </div>
              <span>Town Hall High School</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-stone-600">
        <p>Restricted to Authorized Executive Personnel Only</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
