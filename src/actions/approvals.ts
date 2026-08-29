"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyDirectorSession } from "./auth";
import { recordAuditLogAction } from "./audit";

export type ApprovalActionResult = {
  success: boolean;
  count?: number;
  message?: string;
  error?: string;
};

/**
 * Bulk approves student records in a Prisma transaction.
 * Changes the `recordStatus` to 'APPROVED'.
 * 
 * @param srNumbers Array of Scholar Register (S.R.) Numbers to approve
 */
export async function approveStudents(srNumbers: string[]): Promise<ApprovalActionResult> {
  try {
    const isAuthorized = await verifyDirectorSession();
    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized. Valid Director session required for Maker-Checker approvals.",
      };
    }

    if (!srNumbers || !Array.isArray(srNumbers) || srNumbers.length === 0) {
      return {
        success: false,
        error: "No student records selected for approval.",
      };
    }

    const cleanSrNumbers = srNumbers.map((sr) => sr.trim().toUpperCase()).filter(Boolean);

    if (cleanSrNumbers.length === 0) {
      return {
        success: false,
        error: "Invalid student identifier(s) provided.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      return await tx.student.updateMany({
        where: {
          srNumber: {
            in: cleanSrNumbers,
          },
        },
        data: {
          recordStatus: "APPROVED",
        },
      });
    });

    // Record audit entries for approved scholars
    for (const sr of cleanSrNumbers) {
      await recordAuditLogAction({
        actionType: "DIRECTOR_APPROVAL",
        studentSrNumber: sr,
        prefix: "APR",
        details: {
          approvedBy: "Director (Master Key)",
          timestamp: new Date().toISOString(),
        },
      });
    }

    revalidatePath("/director-dashboard");
    revalidatePath("/directory");
    revalidatePath("/");
    revalidatePath("/registers/data-entry");

    return {
      success: true,
      count: result.count,
      message: `Successfully approved ${result.count} scholar ${
        result.count === 1 ? "record" : "records"
      }.`,
    };
  } catch (error: unknown) {
    console.error("Bulk approval error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve student records. Please try again.",
    };
  }
}

/**
 * Rejects a single student admission or record.
 * Changes the `recordStatus` to 'REJECTED'.
 * 
 * @param srNumber The Scholar Register (S.R.) Number to reject
 * @param reason Optional rejection notes or reasoning
 */
export async function rejectStudent(
  srNumber: string,
  reason?: string
): Promise<ApprovalActionResult> {
  try {
    const isAuthorized = await verifyDirectorSession();
    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized. Valid Director session required to reject records.",
      };
    }

    if (!srNumber || typeof srNumber !== "string") {
      return {
        success: false,
        error: "Scholar Register Number is required.",
      };
    }

    const cleanSr = srNumber.trim().toUpperCase();

    await prisma.student.update({
      where: {
        srNumber: cleanSr,
      },
      data: {
        recordStatus: "REJECTED",
      },
    });

    await recordAuditLogAction({
      actionType: "DIRECTOR_REJECTION",
      studentSrNumber: cleanSr,
      prefix: "REJ",
      details: {
        rejectedBy: "Director (Master Key)",
        reason: reason || "Discrepancy noted during Maker-Checker verification",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/directory");
    revalidatePath("/");
    revalidatePath("/registers/data-entry");

    return {
      success: true,
      count: 1,
      message: `Scholar record (${cleanSr}) has been marked as REJECTED.${
        reason ? ` Reason: ${reason}` : ""
      }`,
    };
  } catch (error: unknown) {
    console.error(`Rejection error for ${srNumber}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reject student record. Please try again.",
    };
  }
}

/**
 * Approves a student deletion request (Maker-Checker).
 * Permanently deletes the student record from SQLite using Prisma cascade delete.
 */
export async function approveStudentDeletion(srNumber: string): Promise<ApprovalActionResult> {
  try {
    const isAuthorized = await verifyDirectorSession();
    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized. Valid Director session required to authorize student deletions.",
      };
    }

    if (!srNumber || typeof srNumber !== "string") {
      return { success: false, error: "Scholar Register Number is required." };
    }

    const cleanSr = srNumber.trim().toUpperCase();

    const existing = await prisma.student.findUnique({
      where: { srNumber: cleanSr },
    });

    if (!existing) {
      return { success: false, error: `Student with S.R. Number "${cleanSr}" not found.` };
    }

    // Cascade delete student
    await prisma.student.delete({
      where: { id: existing.id },
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/directory");
    revalidatePath("/");
    revalidatePath("/registers/data-entry");

    return {
      success: true,
      message: `Director authorization granted: Scholar "${cleanSr}" (${existing.firstName} ${existing.lastName}) has been permanently deleted from the database.`,
    };
  } catch (error: unknown) {
    console.error(`Deletion approval error for ${srNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute student deletion.",
    };
  }
}

/**
 * Rejects a student deletion request (Maker-Checker).
 * Restores the student recordStatus to 'APPROVED'.
 */
export async function rejectStudentDeletion(srNumber: string): Promise<ApprovalActionResult> {
  try {
    const isAuthorized = await verifyDirectorSession();
    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized. Valid Director session required to reject deletion requests.",
      };
    }

    if (!srNumber || typeof srNumber !== "string") {
      return { success: false, error: "Scholar Register Number is required." };
    }

    const cleanSr = srNumber.trim().toUpperCase();

    await prisma.student.update({
      where: { srNumber: cleanSr },
      data: { recordStatus: "APPROVED" },
    });

    await recordAuditLogAction({
      actionType: "DIRECTOR_DELETION_REJECTED",
      studentSrNumber: cleanSr,
      prefix: "RST",
      details: {
        action: "Deletion request rejected by Director; record restored to ACTIVE status.",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/directory");
    revalidatePath("/");
    revalidatePath("/registers/data-entry");

    return {
      success: true,
      message: `Deletion request for Scholar "${cleanSr}" was rejected. The student record has been restored to Active status.`,
    };
  } catch (error: unknown) {
    console.error(`Deletion rejection error for ${srNumber}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject deletion request.",
    };
  }
}

/**
 * Approves a class marks submission batch.
 * Records formal Director clearance in the universal audit ledger and updates the submission log.
 */
export async function approveMarksSubmission(payload: {
  auditLogId?: string;
  studentSrNumber: string;
  className: string;
  sessionYear: string;
  studentCount?: number;
}): Promise<ApprovalActionResult> {
  try {
    const isAuthorized = await verifyDirectorSession();
    if (!isAuthorized) {
      return {
        success: false,
        error: "Unauthorized. Valid Director session required for marks sign-off.",
      };
    }

    const { auditLogId, studentSrNumber, className, sessionYear, studentCount } = payload;

    // Mark the original submission audit log as certified if auditLogId provided
    if (auditLogId) {
      try {
        const targetLog = await prisma.auditLog.findUnique({
          where: { id: auditLogId },
        });
        if (targetLog) {
          let detailsObj: Record<string, any> = {};
          try {
            if (targetLog.details) detailsObj = JSON.parse(targetLog.details);
          } catch {
            detailsObj = {};
          }
          detailsObj.certified = true;
          detailsObj.status = "APPROVED_BY_DIRECTOR";
          detailsObj.certifiedAt = new Date().toISOString();

          await prisma.auditLog.update({
            where: { id: auditLogId },
            data: { details: JSON.stringify(detailsObj) },
          });
        }
      } catch (err) {
        console.warn("Could not update source audit log certification status:", err);
      }
    }

    await recordAuditLogAction({
      actionType: "DIRECTOR_MARKS_APPROVED",
      studentSrNumber: studentSrNumber.trim().toUpperCase(),
      prefix: "MRK-OK",
      details: {
        sourceAuditLogId: auditLogId || null,
        className,
        sessionYear,
        studentCount: studentCount || 1,
        approvedBy: "Director (Executive Key)",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/registers/data-entry");
    revalidatePath("/");

    return {
      success: true,
      message: `Director Sign-Off complete: Marks for ${className} (${sessionYear}) officially verified and certified.`,
    };
  } catch (error: unknown) {
    console.error("Marks approval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve marks submission.",
    };
  }
}

/**
 * Quick single approval convenience action.
 */
export async function approveSingleStudent(srNumber: string): Promise<ApprovalActionResult> {
  return approveStudents([srNumber]);
}
