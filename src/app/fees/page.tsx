import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { FeesDashboardClient } from "@/components/fees/FeesDashboardClient";
import {
  ArrowLeft,
  IndianRupee,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Fees & Dues Management | School ERP",
  description: "Monthly fee management — collect installments, track concessions, manage overdue payments, and generate receipts.",
};

// Helper: compute overdue dynamically at query time (offline-safe, no cron)
function computeLateFineForMonth(
  monthLabel: string,
  lateFeeRate: number,
  alreadyPaid: boolean
): { isOverdue: boolean; fineAmount: number } {
  if (alreadyPaid) return { isOverdue: false, fineAmount: 0 };
  try {
    const date = new Date(`1 ${monthLabel}`);
    if (isNaN(date.getTime())) return { isOverdue: false, fineAmount: 0 };
    const dueDate = new Date(date.getFullYear(), date.getMonth(), 10);
    const today = new Date();
    if (today <= dueDate) return { isOverdue: false, fineAmount: 0 };
    const monthsOverdue = Math.max(
      1,
      (today.getFullYear() - dueDate.getFullYear()) * 12 +
        (today.getMonth() - dueDate.getMonth())
    );
    return { isOverdue: true, fineAmount: monthsOverdue * lateFeeRate };
  } catch {
    return { isOverdue: false, fineAmount: 0 };
  }
}

export default async function FeesPage() {
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Fetch all fee profiles with their payments
  const profiles = await prisma.studentFeeProfile.findMany({
    include: {
      student: {
        select: { firstName: true, lastName: true, srNumber: true, photoPath: true },
      },
      payments: {
        where: { status: { not: "BOUNCED" } },
        orderBy: { paymentDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with overdue status (dynamic at query time)
  const enriched = profiles.map((profile) => {
    const paidMonths = new Set(profile.payments.map((p) => p.monthCovered));
    const currentMonthPaid = paidMonths.has(currentMonthLabel);
    const { isOverdue, fineAmount } = computeLateFineForMonth(
      currentMonthLabel,
      profile.lateFeeRatePerMonth,
      currentMonthPaid
    );
    const totalCollected = profile.payments.reduce((s, p) => s + p.totalPaid, 0);
    return {
      ...profile,
      currentMonthPaid,
      isOverdueNow: isOverdue,
      suggestedLateFine: isOverdue ? fineAmount : 0,
      totalCollected,
      paidMonthsList: Array.from(paidMonths),
    };
  });

  // Recent payments (global, last 30)
  const recentPayments = await prisma.feePayment.findMany({
    take: 30,
    orderBy: { paymentDate: "desc" },
    where: { status: { not: "BOUNCED" } },
  });

  // All students (for assigning fee profiles to new students)
  const allStudents = await prisma.student.findMany({
    select: {
      srNumber: true,
      firstName: true,
      lastName: true,
      academicSessions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { firstName: "asc" },
  });

  // Stats
  const totalStudents = enriched.length;
  const totalOverdue = enriched.filter((p) => p.isOverdueNow).length;
  const totalPaidThisMonth = enriched.filter((p) => p.currentMonthPaid).length;
  const totalCollectionAllTime = enriched.reduce((s, p) => s + p.totalCollected, 0);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 pb-20">
      {/* Header bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-bold text-zinc-200">Fees &amp; Dues</span>
          </div>
          <span className="text-zinc-500 font-mono hidden sm:block">{currentMonthLabel}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page title */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 font-serif">Fees &amp; Dues</h1>
              <p className="text-xs text-zinc-500">Monthly fee collection, concessions, late fines, and payment receipts</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Fee Profiles", value: totalStudents, icon: Users, color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800/60" },
            { label: "Overdue Now", value: totalOverdue, icon: AlertTriangle, color: totalOverdue > 0 ? "text-red-400" : "text-zinc-500", bg: totalOverdue > 0 ? "bg-red-950/40 border-red-800/60" : "bg-zinc-900/40 border-zinc-800/60" },
            { label: `Paid (${currentMonthLabel.split(" ")[0]})`, value: totalPaidThisMonth, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/60" },
            { label: "Total Collection", value: `₹${totalCollectionAllTime.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/60" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border ${stat.bg} p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Client interactive dashboard */}
        <FeesDashboardClient
          profiles={enriched}
          recentPayments={recentPayments}
          allStudents={allStudents}
          currentMonthLabel={currentMonthLabel}
        />
      </main>
    </div>
  );
}
