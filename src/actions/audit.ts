"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

/**
 * Generates an authentic, cryptographically random 8-character hex trace code
 * Format: `<PREFIX>-<8_HEX_CHARS>` (e.g., 'TC-8F92A1B3' or 'PRNT-4C29F01A')
 */
export async function generateTraceCode(prefix: string = "TC"): Promise<string> {
  const cleanPrefix = prefix.trim().toUpperCase() || "LOG";
  const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${cleanPrefix}-${hex}`;
}

export type RecordAuditParams = {
  actionType:
    | "PRINT_TC"
    | "PRINT_REPORT_CARD"
    | "PRINT_SR_FRONT"
    | "PRINT_SR_BACK"
    | "PRINT_ID_CARD"
    | "EDIT_MARK"
    | "EDIT_DEMOGRAPHICS"
    | "DIRECTOR_APPROVAL"
    | "DIRECTOR_REJECTION"
    | string;
  studentSrNumber: string;
  details?: Record<string, unknown> | string;
  prefix?: string;
  traceCode?: string;
};

export type AuditLogItem = {
  id: string;
  actionType: string;
  studentSrNumber: string;
  traceCode: string;
  details: string | null;
  timestamp: Date;
  student?: {
    firstName: string;
    lastName: string;
    srNumber: string;
  };
};

/**
 * Records an enterprise audit log entry in the permanent SQLite database.
 */
export async function recordAuditLogAction(params: RecordAuditParams) {
  try {
    const { actionType, studentSrNumber, details, prefix = "LOG" } = params;

    if (!studentSrNumber) {
      return { success: false, error: "Scholar Register Number is required." };
    }

    const cleanSrNumber = studentSrNumber.trim().toUpperCase();

    // Verify student exists before writing audit log
    const student = await prisma.student.findUnique({
      where: { srNumber: cleanSrNumber },
      select: { srNumber: true },
    });

    if (!student) {
      return { success: false, error: `Student with S.R. No "${cleanSrNumber}" not found.` };
    }

    // Determine or generate unique trace code
    let finalTraceCode = params.traceCode;
    if (finalTraceCode) {
      const existing = await prisma.auditLog.findUnique({
        where: { traceCode: finalTraceCode },
      });
      if (existing) {
        finalTraceCode = `${finalTraceCode}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      }
    } else {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        attempts++;
        finalTraceCode = await generateTraceCode(prefix);
        const existing = await prisma.auditLog.findUnique({
          where: { traceCode: finalTraceCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const serializedDetails =
      typeof details === "string" ? details : details ? JSON.stringify(details) : null;

    const logEntry = await prisma.auditLog.create({
      data: {
        actionType,
        studentSrNumber: cleanSrNumber,
        traceCode: finalTraceCode!,
        details: serializedDetails,
      },
    });

    try {
      revalidatePath(`/students/${encodeURIComponent(cleanSrNumber)}`);
      revalidatePath("/director-dashboard");
    } catch {
      // Safe outside Next.js request context (e.g. CLI or test environment)
    }

    return {
      success: true,
      data: {
        id: logEntry.id,
        traceCode: logEntry.traceCode,
        actionType: logEntry.actionType,
        timestamp: logEntry.timestamp,
      },
    };
  } catch (error: unknown) {
    console.error("Failed to record audit log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record audit event.",
    };
  }
}

/**
 * Retrieves the complete audit history for a specific student.
 */
export async function getStudentAuditLogs(srNumber: string): Promise<AuditLogItem[]> {
  try {
    if (!srNumber) return [];

    const cleanSrNumber = srNumber.trim().toUpperCase();
    const logs = await prisma.auditLog.findMany({
      where: { studentSrNumber: cleanSrNumber },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return logs;
  } catch (err) {
    console.error(`Error fetching audit logs for ${srNumber}:`, err);
    return [];
  }
}

/**
 * Retrieves recent school-wide audit events for the Director Governance dashboard.
 */
export async function getRecentAuditLedger(limit: number = 50): Promise<AuditLogItem[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            srNumber: true,
          },
        },
      },
    });

    return logs;
  } catch (err) {
    console.error("Error fetching recent audit ledger:", err);
    return [];
  }
}

/**
 * Retrieves a single audit log by its unique trace code for public document verification.
 */
export async function getAuditLogByTraceCode(traceCode: string) {
  try {
    if (!traceCode || typeof traceCode !== "string") {
      return null;
    }

    const cleanCode = traceCode.trim().toUpperCase();
    const log = await prisma.auditLog.findUnique({
      where: { traceCode: cleanCode },
      include: {
        student: {
          include: {
            parents: true,
            academicSessions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return log;
  } catch (err) {
    console.error(`Error verifying trace code ${traceCode}:`, err);
    return null;
  }
}
