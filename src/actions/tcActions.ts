"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";

import { verifyDirectorSession } from "./auth";

// ─────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────

/** Generate TC number: TC/<YEAR>/<SEQ> */
export async function generateTCNumber(year: number): Promise<string> {
  const prefix = `TC/${year}/`;
  const existing = await prisma.transferCertificateRecord.count({
    where: { tcNumber: { startsWith: prefix } },
  });
  const seq = String(existing + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

/** Compute human-readable years studied from admission → leaving date */
function computeYearsStudied(admissionDate: Date | null, leavingDate: Date): string {
  if (!admissionDate) return "—";
  const admYear = admissionDate.getFullYear();
  const leavYear = leavingDate.getFullYear();
  const diffYears = leavYear - admYear;
  const suffix = diffYears === 1 ? "Year" : "Years";
  return `${admYear} – ${leavYear} (${diffYears} ${suffix})`;
}

// ─────────────────────────────────────────────────────
// ISSUE TRANSFER CERTIFICATE
// ─────────────────────────────────────────────────────

export interface IssueTCPayload {
  studentSrNumber: string;
  leavingClass: string;
  leavingDate: string;          // ISO date string
  tcNumber?: string;
  promotedTo?: string;
  feeDuesStatus?: string;
  issuedBy?: string;
  reasonForLeaving?: string;
  conduct?: string;
  remarks?: string;
}

export async function issueTransferCertificate(payload: IssueTCPayload) {
  try {
    const {
      studentSrNumber,
      leavingClass,
      leavingDate,
      tcNumber: requestedTcNumber,
      promotedTo,
      feeDuesStatus,
      issuedBy,
      reasonForLeaving,
      conduct,
      remarks,
    } = payload;

    if (!studentSrNumber || !leavingClass || !leavingDate) {
      return { success: false, error: "Student SR number, leaving class, and leaving date are required." };
    }

    const srUpper = studentSrNumber.trim().toUpperCase();

    // Fetch student + first academic session for admission date
    const student = await prisma.student.findUnique({
      where: { srNumber: srUpper },
      include: {
        parents: true,
        academicSessions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!student) {
      return { success: false, error: `Student with SR Number "${srUpper}" not found.` };
    }

    const leaving = new Date(leavingDate);
    const admissionDate = student.admissionDate || (student.academicSessions[0]
      ? new Date(student.academicSessions[0].createdAt)
      : null);

    const father = student.parents.find((p: { relationType: string | null; firstName: string; lastName: string }) => p.relationType?.toLowerCase() === "father");
    const mother = student.parents.find((p: { relationType: string | null; firstName: string; lastName: string }) => p.relationType?.toLowerCase() === "mother");
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const fatherName = father ? `${father.firstName} ${father.lastName}`.trim() : "—";
    const motherName = mother ? `${mother.firstName} ${mother.lastName}`.trim() : undefined;

    const yearsStudied = computeYearsStudied(admissionDate, leaving);
    const year = leaving.getFullYear();
    const tcNumber = requestedTcNumber?.trim() || (await generateTCNumber(year));
    const traceCode = `TC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const isDirector = await verifyDirectorSession();

    if (isDirector) {
      // ═══════════════════════════════════════════════════════════════
      // DIRECTOR PATH: Officially issue TC and permanently freeze record
      // ═══════════════════════════════════════════════════════════════
      const result = await prisma.$transaction(async (tx) => {
        const existingTC = await tx.transferCertificateRecord.findUnique({
          where: { tcNumber },
        });

        let savedTC;
        if (existingTC) {
          savedTC = await tx.transferCertificateRecord.update({
            where: { id: existingTC.id },
            data: {
              leavingClass,
              leavingDate: leaving,
              reasonForLeaving: reasonForLeaving?.trim() || null,
              conduct: conduct?.trim() || "Good",
              promotedTo: promotedTo?.trim() || null,
              feeDuesStatus: feeDuesStatus?.trim() || "NIL",
              remarks: remarks?.trim() || null,
              status: "ISSUED",
            },
          });
        } else {
          savedTC = await tx.transferCertificateRecord.create({
            data: {
              studentSrNumber: srUpper,
              tcNumber,
              studentName,
              fatherName,
              motherName: motherName ?? null,
              admissionClass: student.admissionClass || student.academicSessions[0]?.className || null,
              leavingClass,
              admissionDate,
              leavingDate: leaving,
              yearsStudied,
              issuedBy: issuedBy?.trim() || "Director",
              reasonForLeaving: reasonForLeaving?.trim() || null,
              conduct: conduct?.trim() || "Good",
              promotedTo: promotedTo?.trim() || null,
              feeDuesStatus: feeDuesStatus?.trim() || "NIL",
              remarks: remarks?.trim() || null,
              traceCode,
              status: "ISSUED",
            },
          });
        }

        // Freeze student record permanently
        await tx.student.update({
          where: { srNumber: srUpper },
          data: { recordStatus: "TC_ISSUED" },
        });

        return savedTC;
      });

      // Audit log
      await recordAuditLogAction({
        actionType: "ISSUE_TC",
        studentSrNumber: srUpper,
        prefix: "TC",
        details: {
          tcNumber,
          leavingClass,
          leavingDate,
          promotedTo: promotedTo || "—",
          feeDuesStatus: feeDuesStatus || "NIL",
          issuedBy: issuedBy || "Director",
          traceCode,
          status: "TC_ISSUED_FROZEN",
        },
      });

      try {
        revalidatePath(`/students/${srUpper}`);
        revalidatePath(`/students/${srUpper}/transfer-certificate`);
        revalidatePath("/tc-register");
        revalidatePath("/directory");
        revalidatePath("/registers/data-entry");
        revalidatePath("/");
      } catch {
        // Safe outside Next.js request context
      }

      return {
        success: true,
        isDirector: true,
        staged: false,
        message: `Transfer Certificate ${tcNumber} officially issued. Scholar record is now permanently frozen in TC Register.`,
        tcRecord: result,
      };
    } else {
      // ═══════════════════════════════════════════════════════════════
      // STAFF PATH (MAKER-CHECKER): Stage request for Director approval
      // ═══════════════════════════════════════════════════════════════
      const proposedData = JSON.stringify({
        _editType: "ISSUE_TC",
        studentSrNumber: srUpper,
        tcNumber,
        leavingClass,
        leavingDate: leavingDate,
        reasonForLeaving: reasonForLeaving?.trim() || "Parent's Request",
        conduct: conduct?.trim() || "Good",
        promotedTo: promotedTo?.trim() || "—",
        feeDuesStatus: feeDuesStatus?.trim() || "NIL",
        remarks: remarks?.trim() || "",
        yearsStudied,
        traceCode,
      });

      await prisma.$transaction(async (tx) => {
        await tx.studentEditRequest.create({
          data: {
            studentSrNumber: srUpper,
            changeType: "ISSUE_TC",
            proposedData,
            status: "PENDING",
            submittedBy: "Staff Member",
          },
        });
      });

      await recordAuditLogAction({
        actionType: "EDIT_REQUEST_SUBMITTED",
        studentSrNumber: srUpper,
        prefix: "ESTG",
        details: {
          editType: "ISSUE_TC",
          tcNumber,
          leavingClass,
          leavingDate,
          status: "PENDING_DIRECTOR_APPROVAL",
        },
      });

      try {
        revalidatePath(`/students/${srUpper}`);
        revalidatePath("/approvals");
        revalidatePath("/director-dashboard");
      } catch {
        // Safe outside Next.js request context
      }

      return {
        success: true,
        isDirector: false,
        staged: true,
        message: `Transfer Certificate issuance request staged for Director clearance.`,
      };
    }
  } catch (error) {
    console.error("Failed to issue TC:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to issue TC." };
  }
}

// ─────────────────────────────────────────────────────
// UPDATE TC RECEIVER DETAILS
// ─────────────────────────────────────────────────────

export interface UpdateTCReceiverPayload {
  tcId: string;
  receivedByName: string;
  receivedByRelation: string;
  receivedDate?: string;
  receiptSignatureStatus: "SIGNED" | "PENDING_COLLECTION";
}

export async function updateTCReceiverDetails(payload: UpdateTCReceiverPayload) {
  try {
    const { tcId, receivedByName, receivedByRelation, receivedDate, receiptSignatureStatus } = payload;

    if (!tcId || !receivedByName) {
      return { success: false, error: "TC ID and receiver name are required." };
    }

    const updated = await prisma.transferCertificateRecord.update({
      where: { id: tcId },
      data: {
        receivedByName: receivedByName.trim(),
        receivedByRelation: receivedByRelation.trim(),
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        receiptSignatureStatus,
      },
    });

    try {
      revalidatePath("/tc-register");
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true, tcRecord: updated };
  } catch (error) {
    console.error("Failed to update TC receiver:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update receiver details." };
  }
}

// ─────────────────────────────────────────────────────
// GET TC REGISTRY LIST
// ─────────────────────────────────────────────────────

export interface TCFilters {
  search?: string;
  year?: string;
  status?: string;
}

export async function getTCRegistryList(filters: TCFilters = {}) {
  try {
    const { search, year, status } = filters;

    const records = await prisma.transferCertificateRecord.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { studentName: { contains: search } },
                  { tcNumber: { contains: search } },
                  { studentSrNumber: { contains: search } },
                  { fatherName: { contains: search } },
                ],
              }
            : {},
          year ? { leavingDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } } : {},
          status ? { status } : {},
        ],
      },
      include: {
        student: {
          select: { srNumber: true, firstName: true, lastName: true, photoPath: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, records };
  } catch (error) {
    console.error("Failed to fetch TC registry:", error);
    return { success: false, records: [], error: error instanceof Error ? error.message : "Failed to load TC registry." };
  }
}

// ─────────────────────────────────────────────────────
// UPDATE GENERAL REMARK ON STUDENT
// ─────────────────────────────────────────────────────

export async function updateStudentGeneralRemark(srNumber: string, remark: string) {
  try {
    const srUpper = srNumber.trim().toUpperCase();

    await prisma.student.update({
      where: { srNumber: srUpper },
      data: { generalRemark: remark.trim() || null } as Record<string, string | null>,
    });

    await recordAuditLogAction({
      actionType: "EDIT_DEMOGRAPHICS",
      studentSrNumber: srUpper,
      prefix: "EDT",
      details: { field: "generalRemark", updated: true },
    });

    try {
      revalidatePath(`/students/${srUpper}`);
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update remark:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save remark." };
  }
}
