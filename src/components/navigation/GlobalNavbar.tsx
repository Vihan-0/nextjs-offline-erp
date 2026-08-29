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
  Sparkles,
} from "lucide-react";

interface GlobalNavbarProps {
  pendingApprovals?: number;
}

export function GlobalNavbar({ pendingApprovals = 0 }: GlobalNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
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
    // If format is like SR-XXXX or number, navigate to profile, else search directory
    if (cleanQuery.toUpperCase().startsWith("SR-") || /^\d+$/.test(cleanQuery)) {
      const sr = cleanQuery.toUpperCase().startsWith("SR-") ? cleanQuery.toUpperCase() : `SR-2026-${cleanQuery}`;
      router.push(`/students/${encodeURIComponent(sr)}`);
    } else {
      router.push(`/directory?search=${encodeURIComponent(cleanQuery)}`);
    }
  };

  const navLinks = [
    { href: "/", label: "Portal", icon: Home, shortLabel: "Portal" },
    { href: "/admission", label: "New Admission", shortLabel: "+ Admission", icon: UserPlus, highlight: true },
    { href: "/directory", label: "Directory", shortLabel: "Directory", icon: Users },
    { href: "/registers/data-entry", label: "Marks Register", shortLabel: "Marks", icon: FileSpreadsheet },
    { href: "/verify", label: "Verify Doc (QR)", shortLabel: "Verify", icon: ShieldCheck },
    {
      href: "/director-dashboard",
      label: "Director's Desk",
      shortLabel: "Director",
      icon: Lock,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-zinc-100 shadow-md no-print select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Institution Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-zinc-700 transition-colors p-0.5 shadow-inner">
                <img
                  src="/thphslogo.jpeg"
                  alt="Town Hall Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-zinc-100 uppercase font-serif whitespace-nowrap">
                    Town Hall High School
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 font-bold leading-none">
                    v2.4
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-serif italic hidden min-[540px]:block leading-none mt-0.5">
                  Enterprise Record & Governance System
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Search Bar Trigger (Responsive Truncation & No Wrap) */}
          <div className="hidden lg:flex items-center min-w-0 flex-1 max-w-xs xl:max-w-sm">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-950/90 hover:bg-zinc-950 text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs transition-all cursor-pointer group min-w-0"
              title="Search Scholar (Ctrl+K)"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0 group-hover:text-zinc-300" />
                <span className="truncate whitespace-nowrap text-left text-zinc-400 text-xs">
                  Search scholar, SR no...
                </span>
              </div>
              <kbd className="shrink-0 ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 rounded border border-zinc-800">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 shadow-xs"
                      : link.highlight
                      ? "bg-[#991b1b] hover:bg-[#b91c1c] text-white border border-red-700/60 shadow-xs"
                      : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/90 border border-transparent"
                  }`}
                  title={link.label}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-zinc-950" : link.highlight ? "text-white" : "text-zinc-400"}`} />
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="inline xl:hidden">{link.shortLabel}</span>
                  {link.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-400 text-zinc-950 leading-none">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Actions (Search + Hamburger) */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Search Scholars"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-zinc-200" /> : <Menu className="w-5 h-5 text-zinc-200" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900/98 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : link.highlight
                      ? "bg-[#991b1b] text-white border border-red-800"
                      : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-zinc-950" : link.highlight ? "text-white" : "text-zinc-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-zinc-950">
                      {link.badge} pending
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
            <span className="absolute top-4 right-4 text-zinc-700 font-mono text-xs select-none">+</span>
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                  Quick Scholar & Document Finder
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
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
                  placeholder="Type Scholar Number (e.g. SR-2026-1104) or Student Name..."
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 placeholder:text-zinc-500"
                />
                <Search className="w-5 h-5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Press <strong className="text-zinc-200">Enter</strong> to search • <strong className="text-zinc-200">Esc</strong> to close</span>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-colors cursor-pointer text-xs"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase mb-2">Quick Navigation:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); router.push("/directory"); }}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left text-zinc-300 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400 mb-1" />
                  <span className="font-bold block text-[11px]">All Students</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); router.push("/registers/data-entry"); }}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left text-zinc-300 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <span className="font-bold block text-[11px]">Marks Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); router.push("/admission"); }}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left text-zinc-300 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-rose-400 mb-1" />
                  <span className="font-bold block text-[11px]">New Admission</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); router.push("/verify"); }}
                  className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left text-zinc-300 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mb-1" />
                  <span className="font-bold block text-[11px]">Verify Doc</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
