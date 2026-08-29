"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";

// ─────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────

/** Generate a unique receipt number: REC-<YEAR>-<SEQ> */
async function generateReceiptNumber(year: number): Promise<string> {
  const prefix = `REC-${year}-`;
  const existing = await prisma.feePayment.count({
    where: { receiptNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(existing + 1).padStart(4, "0")}`;
}

/**
 * Dynamically compute how many months are overdue for a given month/year
 * and what the late fine should be. Called at QUERY TIME (offline-safe).
 *
 * A month is considered overdue if today is past the 10th of the following month.
 * Returns: number of overdue months, total fine owed.
 */
export async function computeLateFineForMonth(
  monthLabel: string, // e.g. "April 2026"
  lateFeeRate: number,
  alreadyPaid: boolean
): Promise<{ isOverdue: boolean; fineAmount: number }> {
  if (alreadyPaid) return { isOverdue: false, fineAmount: 0 };

  try {
    // Parse "April 2026" → Date of the 10th of the *next* month (grace period)
    const date = new Date(`1 ${monthLabel}`); // "1 April 2026"
    if (isNaN(date.getTime())) return { isOverdue: false, fineAmount: 0 };

    // Due date = 10th of that month
    const dueDate = new Date(date.getFullYear(), date.getMonth(), 10);
    const today = new Date();

    if (today <= dueDate) return { isOverdue: false, fineAmount: 0 };

    // Count overdue months (at least 1 if past due date)
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

// ─────────────────────────────────────────────────────
// GET STUDENT FEE OVERVIEW (dynamic late fee at query time)
// ─────────────────────────────────────────────────────

export async function getStudentFeeOverview(studentSrNumber: string) {
  try {
    const srUpper = studentSrNumber.trim().toUpperCase();

    const profile = await prisma.studentFeeProfile.findUnique({
      where: { studentSrNumber: srUpper },
      include: {
        payments: { orderBy: [{ monthCovered: "desc" }, { installmentNumber: "desc" }] },
        student: { select: { firstName: true, lastName: true, srNumber: true } },
      },
    });

    if (!profile) return { success: true, profile: null };

    // Compute total paid (excluding bounced)
    const totalPaid = profile.payments
      .filter((p) => p.status !== "BOUNCED")
      .reduce((sum, p) => sum + p.totalPaid, 0);

    // Compute months paid
    const paidMonths = new Set(
      profile.payments.filter((p) => p.status !== "BOUNCED").map((p) => p.monthCovered)
    );

    // Determine current month label for due alert
    const now = new Date();
    const currentMonthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const currentMonthPaid = paidMonths.has(currentMonthLabel);

    // Compute dynamic late fine for current month
    const { isOverdue, fineAmount } = await computeLateFineForMonth(
      currentMonthLabel,
      profile.lateFeeRatePerMonth,
      currentMonthPaid
    );

    return {
      success: true,
      profile: {
        ...profile,
        totalPaid,
        paidMonths: Array.from(paidMonths),
        currentMonthLabel,
        currentMonthPaid,
        isOverdueNow: isOverdue,
        suggestedLateFine: isOverdue ? fineAmount : 0,
      },
    };
  } catch (error) {
    console.error("Failed to get fee overview:", error);
    return { success: false, profile: null, error: error instanceof Error ? error.message : "Failed to load fee data." };
  }
}

// ─────────────────────────────────────────────────────
// UPSERT STUDENT FEE PROFILE
// ─────────────────────────────────────────────────────

export interface UpsertFeeProfilePayload {
  studentSrNumber: string;
  sessionYear: string;
  className: string;
  baseMonthlyFee: number;
  hasConcession: boolean;
  concessionType?: string;
  concessionPercentage?: number;
  concessionAmount?: number;
  concessionReason?: string;
  feeRemarks?: string;
}

export async function upsertStudentFeeProfile(payload: UpsertFeeProfilePayload) {
  try {
    const srUpper = payload.studentSrNumber.trim().toUpperCase();

    const {
      sessionYear, className, baseMonthlyFee, hasConcession,
      concessionType, concessionPercentage, concessionAmount,
      concessionReason, feeRemarks,
    } = payload;

    // Compute netMonthlyFee
    let netMonthlyFee = baseMonthlyFee;
    if (hasConcession) {
      if (concessionAmount && concessionAmount > 0) {
        netMonthlyFee = Math.max(0, baseMonthlyFee - concessionAmount);
      } else if (concessionPercentage && concessionPercentage > 0) {
        netMonthlyFee = Math.max(0, baseMonthlyFee - (baseMonthlyFee * concessionPercentage) / 100);
      }
    }

    const profile = await prisma.studentFeeProfile.upsert({
      where: { studentSrNumber: srUpper },
      create: {
        studentSrNumber: srUpper,
        sessionYear,
        className,
        baseMonthlyFee,
        hasConcession,
        concessionType: hasConcession ? concessionType : null,
        concessionPercentage: hasConcession ? concessionPercentage : null,
        concessionAmount: hasConcession ? concessionAmount : null,
        concessionReason: hasConcession ? concessionReason : null,
        netMonthlyFee,
        feeRemarks: feeRemarks?.trim() || null,
      },
      update: {
        sessionYear,
        className,
        baseMonthlyFee,
        hasConcession,
        concessionType: hasConcession ? concessionType : null,
        concessionPercentage: hasConcession ? concessionPercentage : null,
        concessionAmount: hasConcession ? concessionAmount : null,
        concessionReason: hasConcession ? concessionReason : null,
        netMonthlyFee,
        feeRemarks: feeRemarks?.trim() || null,
      },
    });

    try {
      revalidatePath(`/students/${srUpper}`);
      revalidatePath("/fees");
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Failed to upsert fee profile:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save fee profile." };
  }
}

// ─────────────────────────────────────────────────────
// RECORD FEE PAYMENT (Installment)
// ─────────────────────────────────────────────────────

export interface RecordFeePaymentPayload {
  studentSrNumber: string;
  feeProfileId: string;
  sessionYear: string;
  className: string;
  monthCovered: string;         // e.g. "April 2026"
  installmentNumber: number;
  installmentPaid: number;
  lateFeeFine: number;          // Cashier can override/waive; computed dynamically on client
  modeOfPayment: string;
  transactionReference?: string;
  paymentReceivedBy: string;
  paymentDate?: string;         // ISO date string; defaults to now
  dueDate: string;              // ISO date string of the monthly due date
  remarks?: string;
}

export async function recordFeePayment(payload: RecordFeePaymentPayload) {
  try {
    const srUpper = payload.studentSrNumber.trim().toUpperCase();

    const {
      feeProfileId, sessionYear, className, monthCovered,
      installmentNumber, installmentPaid, lateFeeFine,
      modeOfPayment, transactionReference, paymentReceivedBy,
      paymentDate, dueDate, remarks,
    } = payload;

    if (!paymentReceivedBy?.trim()) {
      return { success: false, error: "Payment received by (cashier name) is required." };
    }

    const totalPaid = installmentPaid + lateFeeFine;
    const now = new Date();
    const year = now.getFullYear();
    const receiptNumber = await generateReceiptNumber(year);

    const payment = await prisma.feePayment.create({
      data: {
        receiptNumber,
        studentSrNumber: srUpper,
        feeProfileId,
        sessionYear,
        className,
        monthCovered,
        installmentNumber,
        installmentPaid,
        lateFeeFine,
        totalPaid,
        modeOfPayment,
        transactionReference: transactionReference?.trim() || null,
        paymentReceivedBy: paymentReceivedBy.trim(),
        paymentDate: paymentDate ? new Date(paymentDate) : now,
        dueDate: new Date(dueDate),
        status: "PAID",
        remarks: remarks?.trim() || null,
      },
    });

    // Audit trail
    await recordAuditLogAction({
      actionType: "FEE_PAYMENT",
      studentSrNumber: srUpper,
      prefix: "FEE",
      details: {
        receiptNumber,
        monthCovered,
        installmentPaid,
        lateFeeFine,
        totalPaid,
        modeOfPayment,
        paymentReceivedBy,
      },
    });

    try {
      revalidatePath(`/students/${srUpper}`);
      revalidatePath("/fees");
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true, payment };
  } catch (error) {
    console.error("Failed to record fee payment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to record payment." };
  }
}

// ─────────────────────────────────────────────────────
// FEES DASHBOARD DATA
// ─────────────────────────────────────────────────────

export interface FeesDashboardFilters {
  search?: string;
  sessionYear?: string;
  className?: string;
}

export async function getFeesDashboardData(filters: FeesDashboardFilters = {}) {
  try {
    const { search, sessionYear, className } = filters;
    const now = new Date();

    const profiles = await prisma.studentFeeProfile.findMany({
      where: {
        AND: [
          sessionYear ? { sessionYear } : {},
          className ? { className: { contains: className } } : {},
        ],
      },
      include: {
        student: {
          select: {
            firstName: true, lastName: true, srNumber: true, photoPath: true,
          },
        },
        payments: {
          where: { status: { not: "BOUNCED" } },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const currentMonthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    // Enrich each profile with dynamic overdue status
    const enriched = await Promise.all(
      profiles
        .filter((p) => {
          if (!search) return true;
          const name = `${p.student.firstName} ${p.student.lastName}`.toLowerCase();
          return (
            name.includes(search.toLowerCase()) ||
            p.student.srNumber.toLowerCase().includes(search.toLowerCase())
          );
        })
        .map(async (profile) => {
          const paidMonths = new Set(profile.payments.map((p) => p.monthCovered));
          const currentMonthPaid = paidMonths.has(currentMonthLabel);
          const { isOverdue, fineAmount } = await computeLateFineForMonth(
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
            paidMonths: Array.from(paidMonths),
          };
        })
    );

    // Aggregate stats
    const totalStudentsWithFees = enriched.length;
    const totalOverdue = enriched.filter((p) => p.isOverdueNow).length;
    const totalPaidThisMonth = enriched.filter((p) => p.currentMonthPaid).length;
    const totalCollectionAllTime = enriched.reduce((s, p) => s + p.totalCollected, 0);

    // Recent payments (last 20 across all students)
    const recentPayments = await prisma.feePayment.findMany({
      take: 20,
      orderBy: { paymentDate: "desc" },
      where: { status: { not: "BOUNCED" } },
    });

    return {
      success: true,
      profiles: enriched,
      stats: { totalStudentsWithFees, totalOverdue, totalPaidThisMonth, totalCollectionAllTime },
      recentPayments,
      currentMonthLabel,
    };
  } catch (error) {
    console.error("Failed to load fees dashboard:", error);
    return {
      success: false,
      profiles: [],
      stats: { totalStudentsWithFees: 0, totalOverdue: 0, totalPaidThisMonth: 0, totalCollectionAllTime: 0 },
      recentPayments: [],
      currentMonthLabel: "",
      error: error instanceof Error ? error.message : "Failed to load fees data.",
    };
  }
}
