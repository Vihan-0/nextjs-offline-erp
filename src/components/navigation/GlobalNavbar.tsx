"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Lock,
  Home,
  X,
  ArrowRight,
  Menu,
  FileText,
  IndianRupee,
  ChevronDown,
} from "lucide-react";

interface GlobalNavbarProps {
  pendingApprovals?: number;
}

export function GlobalNavbar({ pendingApprovals = 0 }: GlobalNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    setSearchOpen(false);
    if (cleanQuery.toUpperCase().startsWith("SR-") || /^\d+$/.test(cleanQuery)) {
      const sr = cleanQuery.toUpperCase().startsWith("SR-") ? cleanQuery.toUpperCase() : `SR-2026-${cleanQuery}`;
      router.push(`/students/${encodeURIComponent(sr)}`);
    } else {
      router.push(`/directory?search=${encodeURIComponent(cleanQuery)}`);
    }
  };

  // Primary nav: always visible on desktop
  const primaryLinks = [
    { href: "/admission", label: "New Admission", shortLabel: "Admit", icon: UserPlus, highlight: true },
    { href: "/directory", label: "Directory", shortLabel: "Directory", icon: Users },
    { href: "/registers/data-entry", label: "Marks", shortLabel: "Marks", icon: FileSpreadsheet },
  ];

  // Secondary nav: shown in "More" dropdown on desktop; all shown in mobile drawer
  const secondaryLinks = [
    { href: "/tc-register", label: "TC Folder", icon: FileText },
    { href: "/fees", label: "Fees & Dues", icon: IndianRupee },
    { href: "/verify", label: "Verify Doc", icon: ShieldCheck },
    {
      href: "/director-dashboard",
      label: "Director's Desk",
      icon: Lock,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
  ];

  const allLinks = [...primaryLinks, ...secondaryLinks];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Is any secondary link currently active? Used to highlight More button
  const anySecondaryActive = secondaryLinks.some((l) => isActive(l.href));

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100 shadow-md no-print select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-zinc-700 transition-colors p-0.5 shadow-inner">
                <img src="/thphslogo.jpeg" alt="Town Hall Emblem" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-zinc-100 uppercase font-serif whitespace-nowrap leading-none">
                  Town Hall High School
                </span>
                <span className="text-[9px] text-zinc-500 font-serif italic hidden sm:block leading-none mt-0.5">
                  Enterprise Record &amp; Governance System
                </span>
              </div>
            </Link>
          </div>

          {/* Search bar trigger — desktop only */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-[220px] xl:max-w-xs px-3 py-1.5 bg-zinc-950/90 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs transition-all cursor-pointer"
            title="Search Scholar (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate text-zinc-500 text-xs">Search scholar…</span>
            <kbd className="ml-auto shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 text-zinc-500 rounded border border-zinc-800">⌘K</kbd>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {/* Portal home */}
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/90"
              }`}
              title="Portal"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>

            {/* Primary links */}
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? "bg-zinc-100 text-zinc-950"
                      : link.highlight
                      ? "bg-[#991b1b] hover:bg-[#b91c1c] text-white border border-red-700/60"
                      : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/90 border border-transparent"
                  }`}
                  title={link.label}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-zinc-950" : link.highlight ? "text-white" : "text-zinc-400"}`} />
                  <span>{link.shortLabel}</span>
                </Link>
              );
            })}

            {/* "More" dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((p) => !p)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  anySecondaryActive
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/90 border border-transparent"
                }`}
              >
                More
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                {pendingApprovals > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-400 text-zinc-950 leading-none">
                    {pendingApprovals}
                  </span>
                )}
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  {secondaryLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold transition-colors ${
                          active ? "text-zinc-100 bg-zinc-800" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-zinc-100" : "text-zinc-500"}`} />
                        <span>{link.label}</span>
                        {link.badge !== undefined && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-400 text-zinc-950">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: search + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-zinc-200" /> : <Menu className="w-5 h-5 text-zinc-200" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900/98 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
            {allLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const highlight = "highlight" in link ? link.highlight : false;
              const badge = "badge" in link ? link.badge : undefined;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-zinc-100 text-zinc-950"
                      : highlight
                      ? "bg-[#991b1b] text-white border border-red-800"
                      : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-zinc-950" : highlight ? "text-white" : "text-zinc-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  {badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-zinc-950">
                      {badge} pending
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-20 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                  Quick Scholar &amp; Document Finder
                </span>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Scholar Number (e.g. SR-2026-1104) or Student Name..."
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-500"
                />
                <Search className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Press <strong className="text-zinc-200">Enter</strong> to search • <strong className="text-zinc-200">Esc</strong> to close</span>
                <button type="submit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-colors cursor-pointer text-xs">
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase mb-2">Quick Navigation:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: "All Students", icon: Users, color: "text-blue-400", href: "/directory" },
                  { label: "Marks Grid", icon: FileSpreadsheet, color: "text-emerald-400", href: "/registers/data-entry" },
                  { label: "TC Folder", icon: FileText, color: "text-red-400", href: "/tc-register" },
                  { label: "Verify Doc", icon: ShieldCheck, color: "text-amber-400", href: "/verify" },
                ].map((q) => (
                  <button
                    key={q.href}
                    type="button"
                    onClick={() => { setSearchOpen(false); router.push(q.href); }}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left text-zinc-300 transition-colors cursor-pointer"
                  >
                    <q.icon className={`w-3.5 h-3.5 ${q.color} mb-1`} />
                    <span className="font-bold block text-[11px]">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
