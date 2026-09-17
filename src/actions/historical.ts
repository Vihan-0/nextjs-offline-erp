"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";
import { verifyDirectorSession } from "./auth";
import { CURRENT_SESSION, generateIntermediateSessions, resolveCanonicalClassName } from "@/lib/classHierarchy";

export async function stageHistoricalSessionAction(
  studentSrNumber: string,
  formData: FormData
) {
  try {
    const sessionYear = formData.get("sessionYear")?.toString().trim();
    const className = formData.get("className")?.toString().trim();

    if (!sessionYear || !className) {
      return { success: false, error: "Session year and class are required." };
    }

    const student = await prisma.student.findUnique({
      where: { srNumber: studentSrNumber },
      include: { academicSessions: true },
    });

    if (!student) {
      return { success: false, error: "Student not found." };
    }

    // Check if session already exists
    const sessionExists = student.academicSessions.some(
      (s) => s.sessionYear === sessionYear && s.className === className
    );

    if (sessionExists) {
      return {
        success: false,
        error: `Session ${sessionYear} for ${className} already exists for this student.`,
      };
    }

    const canonicalClass = resolveCanonicalClassName(className);
    
    // Generate intermediate sessions up to the CURRENT_SESSION
    const generatedSessions = generateIntermediateSessions(
      canonicalClass,
      sessionYear,
      CURRENT_SESSION
    );

    // Filter out sessions that already exist
    const sessionsToCreate = generatedSessions.filter(
      (gs) => !student.academicSessions.some((es) => es.sessionYear === gs.sessionYear)
    );

    if (sessionsToCreate.length === 0) {
      return {
        success: false,
        error: `Sessions from ${sessionYear} to ${CURRENT_SESSION} already exist.`,
      };
    }

    const isDirector = await verifyDirectorSession();

    if (isDirector) {
      // ═══════════════════════════════════════════════════════════════
      // DIRECTOR PATH: Immediately create session(s)
      // ═══════════════════════════════════════════════════════════════
      await prisma.$transaction(async (tx) => {
        await tx.academicSession.createMany({
          data: sessionsToCreate.map((s) => ({
            studentSrNumber,
            sessionYear: s.sessionYear,
            className: s.className,
          })),
        });

        await recordAuditLogAction({
          actionType: "HISTORICAL_SESSION_ADDED",
          studentSrNumber,
          prefix: "HSA",
          details: {
            addedBy: "Director (Executive Key)",
            sessionYear,
            className: canonicalClass,
            generatedCount: sessionsToCreate.length,
            timestamp: new Date().toISOString(),
          },
        });
      });

      revalidatePath(`/students/${encodeURIComponent(studentSrNumber)}`);
      revalidatePath("/registers/data-entry");

      return {
        success: true,
        message: `Historical session ${sessionYear} (${className}) added directly by Director.`,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // STAFF PATH: Stage Edit Request for Director Approval
    // ═══════════════════════════════════════════════════════════════
    // We pass the sessionsToCreate payload so the Director approves the entire block
    const proposedData = JSON.stringify({
      _editType: "ADD_HISTORICAL_SESSION",
      sessionYear,
      className: canonicalClass,
      sessionsToCreate,
    });

    await prisma.$transaction(async (tx) => {
      const request = await tx.studentEditRequest.create({
        data: {
          studentSrNumber,
          proposedData,
          status: "PENDING",
          submittedBy: "Staff Member",
        },
      });

      await recordAuditLogAction({
        actionType: "EDIT_REQUEST_SUBMITTED",
        studentSrNumber,
        prefix: "ESTG",
        details: {
          requestId: request.id,
          editType: "ADD_HISTORICAL_SESSION",
          sessionYear,
          className,
          status: "PENDING_DIRECTOR_APPROVAL",
        },
      });
    });

    revalidatePath(`/students/${encodeURIComponent(studentSrNumber)}`);
    revalidatePath("/director-dashboard");
    revalidatePath("/approvals");

    return {
      success: true,
      message: `Historical session ${sessionYear} staged for Director approval.`,
    };
  } catch (error: unknown) {
    console.error("Failed to stage historical session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit request.",
    };
  }
}
