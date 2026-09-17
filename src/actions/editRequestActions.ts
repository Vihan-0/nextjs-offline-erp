"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";
import { encryptData } from "@/lib/encryption";
import path from "path";
import fs from "fs/promises";

/**
 * Fetches all PENDING edit requests with student details for the Director's approval page.
 */
export async function getEditRequests(status: string = "PENDING") {
  const requests = await prisma.studentEditRequest.findMany({
    where: { status },
    include: {
      student: {
        include: {
          parents: true,
          academicSessions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
}

/**
 * Get the count of pending edit requests for badge display.
 */
export async function getPendingEditRequestCount(): Promise<number> {
  return prisma.studentEditRequest.count({
    where: { status: "PENDING" },
  });
}

/**
 * Approves a staged edit request:
 *   1. Parse proposedData JSON → apply each field to the live Student record
 *   2. Move files from storage/enclosures/temp/ → storage/enclosures/ (production)
 *   3. Update parent records if parent fields are in the payload
 *   4. Set status = "APPROVED" and reviewedAt = now()
 *   5. Record audit log
 */
export async function approveEditRequest(requestId: string) {
  try {
    const request = await prisma.studentEditRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            parents: true,
            academicSessions: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Edit request not found." };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: `Edit request has already been ${request.status.toLowerCase()}.` };
    }

    const proposed = JSON.parse(request.proposedData) as Record<string, unknown>;
    const attachedFiles: { fieldName: string; tempPath: string }[] = request.attachedFiles
      ? JSON.parse(request.attachedFiles)
      : [];

    const srNumber = request.studentSrNumber;
    const student = request.student;

    // Move files from temp to production
    const movedFiles: Record<string, string> = {};
    for (const af of attachedFiles) {
      const moved = await moveFileToProduction(af.tempPath);
      if (moved) {
        movedFiles[af.fieldName] = moved;
      }
    }

    // Encrypt Aadhaar if provided
    const aadharRaw = proposed.aadharNumber as string | null;
    const encryptedAadhar = aadharRaw
      ? encryptData(aadharRaw.replace(/\s/g, ""))
      : undefined;

    // Build student update data from proposed fields
    const studentUpdate: Record<string, unknown> = {};

    const directFields = [
      "firstName", "lastName", "gender", "bloodGroup",
      "religion", "category", "nationality",
      "medicalConditions", "allergies",
      "currentAddress", "permanentAddress",
    ];

    for (const field of directFields) {
      if (proposed[field] !== undefined && proposed[field] !== null) {
        studentUpdate[field] = proposed[field];
      }
    }

    if (proposed.dateOfBirth) {
      studentUpdate.dateOfBirth = new Date(proposed.dateOfBirth as string);
    }
    if (proposed.distanceFromSchool !== undefined && proposed.distanceFromSchool !== null) {
      studentUpdate.distanceFromSchool = parseFloat(proposed.distanceFromSchool as string);
    }
    if (encryptedAadhar) {
      studentUpdate.aadharNumber = encryptedAadhar;
    }
    if (proposed.motherIncome !== undefined && proposed.motherIncome !== null) {
      studentUpdate.motherIncome = parseFloat(proposed.motherIncome as string);
    }

    // Apply file paths from moved files
    if (movedFiles.photoPath) studentUpdate.photoPath = movedFiles.photoPath;
    if (movedFiles.birthCertificatePath) studentUpdate.birthCertificatePath = movedFiles.birthCertificatePath;
    if (movedFiles.aadharCardPath) studentUpdate.aadharCardPath = movedFiles.aadharCardPath;
    if (movedFiles.transferCertificatePath) studentUpdate.transferCertificatePath = movedFiles.transferCertificatePath;
    if (movedFiles.parentPanCardPath) studentUpdate.parentPanCardPath = movedFiles.parentPanCardPath;

    studentUpdate.recordStatus = "APPROVED";

    if (proposed._editType === "DELETE_STUDENT") {
      await prisma.$transaction(async (tx) => {
        await tx.student.delete({
          where: { id: student.id },
        });

        await tx.studentEditRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
      });

      await recordAuditLogAction({
        actionType: "STUDENT_DELETED",
        studentSrNumber: srNumber,
        prefix: "DEL",
        details: {
          requestId,
          deletedBy: "Director (Executive Key)",
          reason: (proposed.reason as string) || "Permanent record removal via edit request",
          timestamp: new Date().toISOString(),
        },
      });

      revalidatePath("/directory");
      revalidatePath("/registers/data-entry");
      revalidatePath("/director-dashboard");
      revalidatePath("/approvals");
      revalidatePath("/");

      return {
        success: true,
        message: `Director authorization granted: Scholar "${srNumber}" has been permanently deleted from the database.`,
      };
    }

    if (proposed._editType === "ADD_HISTORICAL_SESSION") {
      const sessionYear = proposed.sessionYear as string;
      const className = proposed.className as string;

      if (!sessionYear || !className) {
        return { success: false, error: "Missing session year or class name." };
      }

      await prisma.$transaction(async (tx) => {
        if (proposed.sessionsToCreate && Array.isArray(proposed.sessionsToCreate)) {
          await tx.academicSession.createMany({
            data: proposed.sessionsToCreate.map((s: any) => ({
              studentSrNumber: srNumber,
              sessionYear: s.sessionYear,
              className: s.className,
            })),
          });
        } else {
          await tx.academicSession.create({
            data: {
              studentSrNumber: srNumber,
              sessionYear,
              className,
            },
          });
        }

        await tx.studentEditRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
      });

      await recordAuditLogAction({
        actionType: "HISTORICAL_SESSION_APPROVED",
        studentSrNumber: srNumber,
        prefix: "HSA",
        details: {
          requestId,
          sessionYear,
          className,
          generatedCount: proposed.sessionsToCreate && Array.isArray(proposed.sessionsToCreate) ? proposed.sessionsToCreate.length : 1,
          approvedBy: "Director (Executive Key)",
          timestamp: new Date().toISOString(),
        },
      });

      revalidatePath(`/students/${encodeURIComponent(srNumber)}`);
      revalidatePath("/registers/data-entry");
      revalidatePath("/director-dashboard");
      revalidatePath("/approvals");
      revalidatePath("/");

      return {
        success: true,
        message: `Historical session ${sessionYear} (${className}) approved and added for Scholar "${srNumber}".`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update live Student record
      await tx.student.update({
        where: { srNumber },
        data: studentUpdate,
      });

      // 2. Update Father if fields provided
      const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
      if (father && proposed.fatherName) {
        const fatherName = proposed.fatherName as string;
        await tx.parent.update({
          where: { id: father.id },
          data: {
            firstName: fatherName.split(" ")[0] || father.firstName,
            lastName: fatherName.split(" ").slice(1).join(" ") || father.lastName,
            phoneNumber: proposed.fatherPhone as string || father.phoneNumber,
            occupation: proposed.fatherOccupation as string || father.occupation,
            educationQualification: proposed.fatherEducation as string || father.educationQualification,
            annualIncome: proposed.fatherIncome ? parseFloat(proposed.fatherIncome as string) : father.annualIncome,
            address: proposed.address as string || father.address,
            panCardPath: movedFiles.parentPanCardPath || father.panCardPath,
            fatherPhotoPath: movedFiles.fatherPhotoPath || father.fatherPhotoPath,
            parentPhotoPath: movedFiles.fatherPhotoPath || father.parentPhotoPath,
          },
        });
      }

      // 3. Update Mother if fields provided
      const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
      if (mother && proposed.motherName) {
        const motherName = proposed.motherName as string;
        await tx.parent.update({
          where: { id: mother.id },
          data: {
            firstName: motherName.split(" ")[0] || mother.firstName,
            lastName: motherName.split(" ").slice(1).join(" ") || mother.lastName,
            phoneNumber: proposed.motherPhone as string || mother.phoneNumber,
            occupation: proposed.motherOccupation as string || mother.occupation,
            educationQualification: proposed.motherEducation as string || mother.educationQualification,
            annualIncome: proposed.motherIncome ? parseFloat(proposed.motherIncome as string) : mother.annualIncome,
            address: proposed.address as string || mother.address,
            panCardPath: movedFiles.parentPanCardPath || mother.panCardPath,
            motherPhotoPath: movedFiles.motherPhotoPath || mother.motherPhotoPath,
            parentPhotoPath: movedFiles.motherPhotoPath || mother.parentPhotoPath,
          },
        });
      }

      // 4. Update Academic Session if class/session provided
      if (proposed.className || proposed.sessionYear) {
        const latestSession = student.academicSessions[0];
        if (latestSession) {
          await tx.academicSession.update({
            where: { id: latestSession.id },
            data: {
              className: (proposed.className as string) || latestSession.className,
              sessionYear: (proposed.sessionYear as string) || latestSession.sessionYear,
            },
          });
        }
      }

      // 5. Mark request as APPROVED
      await tx.studentEditRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });
    });

    // Record audit log
    await recordAuditLogAction({
      actionType: "EDIT_REQUEST_APPROVED",
      studentSrNumber: srNumber,
      prefix: "EAPR",
      details: {
        requestId,
        studentSrNumber: srNumber,
        fullName: `${proposed.firstName || student.firstName} ${proposed.lastName || student.lastName}`,
        approvedBy: "Director (Executive Key)",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath(`/students/${encodeURIComponent(srNumber)}`);
    revalidatePath("/directory");
    revalidatePath("/director-dashboard");
    revalidatePath("/approvals");
    revalidatePath("/");

    return {
      success: true,
      message: `Edit request for Scholar "${srNumber}" has been approved and applied to the live record.`,
    };
  } catch (error: unknown) {
    console.error("Failed to approve edit request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve edit request.",
    };
  }
}

/**
 * Rejects a staged edit request:
 *   1. Delete temp files from storage/enclosures/temp/
 *   2. Set status = "REJECTED" and rejectionReason
 *   3. Record audit log
 */
export async function rejectEditRequest(requestId: string, reason?: string) {
  try {
    const request = await prisma.studentEditRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      return { success: false, error: "Edit request not found." };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: `Edit request has already been ${request.status.toLowerCase()}.` };
    }

    // Clean up temp files
    const attachedFiles: { fieldName: string; tempPath: string }[] = request.attachedFiles
      ? JSON.parse(request.attachedFiles)
      : [];

    for (const af of attachedFiles) {
      await deleteTempFile(af.tempPath);
    }

    // Mark as REJECTED
    await prisma.studentEditRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Rejected by Director",
        reviewedAt: new Date(),
      },
    });

    // Record audit log
    await recordAuditLogAction({
      actionType: "EDIT_REQUEST_REJECTED",
      studentSrNumber: request.studentSrNumber,
      prefix: "EREJ",
      details: {
        requestId,
        studentSrNumber: request.studentSrNumber,
        fullName: `${request.student.firstName} ${request.student.lastName}`,
        rejectedBy: "Director (Executive Key)",
        reason: reason || "No reason provided",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/approvals");
    revalidatePath("/");

    return {
      success: true,
      message: `Edit request for Scholar "${request.studentSrNumber}" has been rejected.`,
    };
  } catch (error: unknown) {
    console.error("Failed to reject edit request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject edit request.",
    };
  }
}

// ========================================================
// FILE UTILITY HELPERS
// ========================================================

/** Move a file from storage/enclosures/temp/ to storage/enclosures/ (production). */
async function moveFileToProduction(tempFilename: string): Promise<string | null> {
  try {
    const tempDir = path.join(process.cwd(), "storage", "enclosures", "temp");
    const prodDir = path.join(process.cwd(), "storage", "enclosures");
    const srcPath = path.join(tempDir, tempFilename);
    const destPath = path.join(prodDir, tempFilename);

    await fs.rename(srcPath, destPath);
    return tempFilename;
  } catch (err) {
    console.error(`Error moving temp file ${tempFilename} to production:`, err);
    return null;
  }
}

/** Delete a temp file from storage/enclosures/temp/. */
async function deleteTempFile(tempFilename: string): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), "storage", "enclosures", "temp");
    const filePath = path.join(tempDir, tempFilename);
    await fs.unlink(filePath);
  } catch (err) {
    // File may not exist — that's okay
    console.warn(`Could not delete temp file ${tempFilename}:`, err);
  }
}
