"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recordAuditLogAction } from "./audit";
import { encryptData } from "@/lib/encryption";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { parseSessionStartYear } from "@/lib/classHierarchy";
import { generateTCNumber } from "./tcActions";

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
            academicSessions: { orderBy: [{ sessionYear: "desc" }, { createdAt: "desc" }], take: 1 },
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

    // Encrypt Aadhaar & PAN if provided
    const aadharRaw = proposed.aadharNumber as string | null;
    const encryptedAadhar = aadharRaw
      ? encryptData(aadharRaw.replace(/\s/g, ""))
      : undefined;

    const fatherAadharRaw = proposed.fatherAadhar as string | null;
    const encryptedFatherAadhar = fatherAadharRaw
      ? encryptData(fatherAadharRaw.replace(/\s/g, ""))
      : undefined;

    const motherAadharRaw = proposed.motherAadhar as string | null;
    const encryptedMotherAadhar = motherAadharRaw
      ? encryptData(motherAadharRaw.replace(/\s/g, ""))
      : undefined;

    const parentPanRaw = proposed.parentPan as string | null;
    const encryptedParentPan = parentPanRaw
      ? encryptData(parentPanRaw.replace(/\s/g, "").toUpperCase())
      : undefined;

    // Build student update data from proposed fields
    const studentUpdate: Record<string, unknown> = {};

    const directFields = [
      "firstName", "lastName", "gender", "bloodGroup",
      "religion", "category", "nationality",
      "medicalConditions", "allergies",
      "currentAddress", "permanentAddress",
      "penNumber", "apaarId", "admissionClass", "admissionSession", "currentClass",
    ];

    for (const field of directFields) {
      if (proposed[field] !== undefined && proposed[field] !== null) {
        studentUpdate[field] = proposed[field];
      }
    }

    if (proposed.className || proposed.currentClass) {
      studentUpdate.currentClass = (proposed.className || proposed.currentClass) as string;
    }

    if (proposed.dateOfBirth) {
      const parsedDob = new Date(proposed.dateOfBirth as string);
      if (!isNaN(parsedDob.getTime())) {
        studentUpdate.dateOfBirth = parsedDob;
      }
    }
    if (proposed.admissionDate) {
      const parsedAdm = new Date(proposed.admissionDate as string);
      if (!isNaN(parsedAdm.getTime())) {
        studentUpdate.admissionDate = parsedAdm;
      }
    }
    if (proposed.distanceFromSchool !== undefined && proposed.distanceFromSchool !== null) {
      studentUpdate.distanceFromSchool = parseFloat(proposed.distanceFromSchool as string);
    }
    if (encryptedAadhar) {
      studentUpdate.aadharNumber = encryptedAadhar;
    }
    if (proposed.motherIncome !== undefined && proposed.motherIncome !== null) {
      studentUpdate.motherIncome = String(proposed.motherIncome);
    }

    // Address sync fallback
    if (proposed.address) {
      if (!studentUpdate.currentAddress) studentUpdate.currentAddress = proposed.address;
      if (!studentUpdate.permanentAddress) studentUpdate.permanentAddress = proposed.address;
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
        const addedSessions: { sessionYear: string; className: string }[] = [];
        if (proposed.sessionsToCreate && Array.isArray(proposed.sessionsToCreate)) {
          for (const s of proposed.sessionsToCreate as any[]) {
            addedSessions.push({ sessionYear: s.sessionYear, className: s.className });
          }
          await tx.academicSession.createMany({
            data: proposed.sessionsToCreate.map((s: any) => ({
              studentSrNumber: srNumber,
              sessionYear: s.sessionYear,
              className: s.className,
            })),
          });
        } else {
          addedSessions.push({ sessionYear, className });
          await tx.academicSession.create({
            data: {
              studentSrNumber: srNumber,
              sessionYear,
              className,
            },
          });
        }

        // Dynamic currentClass & admissionClass recalculation
        const allSessions = [
          ...student.academicSessions,
          ...addedSessions,
        ].sort((a, b) => {
          const yA = parseSessionStartYear(a.sessionYear) ?? 0;
          const yB = parseSessionStartYear(b.sessionYear) ?? 0;
          return yA - yB;
        });

        const earliest = allSessions[0];
        const latest = allSessions[allSessions.length - 1];

        const updateData: {
          admissionSession?: string;
          admissionClass?: string;
          currentClass?: string;
        } = {};

        if (earliest) {
          const currentAdmYear = parseSessionStartYear(student.admissionSession || "") ?? Infinity;
          const earliestYear = parseSessionStartYear(earliest.sessionYear) ?? Infinity;
          if (earliestYear < currentAdmYear || !student.admissionSession) {
            updateData.admissionSession = earliest.sessionYear;
            updateData.admissionClass = earliest.className;
          }
        }

        if (latest) {
          updateData.currentClass = latest.className;
        }

        if (Object.keys(updateData).length > 0) {
          await tx.student.update({
            where: { srNumber },
            data: updateData,
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
      revalidatePath(`/students/${encodeURIComponent(srNumber)}/sr-back-page`);
      revalidatePath(`/students/${encodeURIComponent(srNumber)}/transfer-certificate`);
      revalidatePath("/registers/data-entry");
      revalidatePath("/director-dashboard");
      revalidatePath("/approvals");
      revalidatePath("/directory");
      revalidatePath("/");

      return {
        success: true,
        message: `Historical session ${sessionYear} (${className}) approved and added for Scholar "${srNumber}".`,
      };
    }

    if (request.changeType === "ISSUE_TC" || proposed._editType === "ISSUE_TC") {
      const leavingDate = proposed.leavingDate ? new Date(proposed.leavingDate as string) : new Date();
      const leavingClass = (proposed.leavingClass as string) || student.currentClass || "Class 1";
      const reasonForLeaving = (proposed.reasonForLeaving as string) || "Parent's Request";
      const conduct = (proposed.conduct as string) || "Good";
      const promotedTo = (proposed.promotedTo as string) || null;
      const feeDuesStatus = (proposed.feeDuesStatus as string) || "NIL";
      const remarks = (proposed.remarks as string) || null;

      const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
      const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
      const studentName = `${student.firstName} ${student.lastName}`.trim();
      const fatherName = father ? `${father.firstName} ${father.lastName}`.trim() : "—";
      const motherName = mother ? `${mother.firstName} ${mother.lastName}`.trim() : null;

      const admissionDate = student.admissionDate || (student.academicSessions[0] ? new Date(student.academicSessions[0].createdAt) : null);
      const admissionClass = student.admissionClass || student.academicSessions[0]?.className || null;

      const admYear = admissionDate ? admissionDate.getFullYear() : leavingDate.getFullYear();
      const leavYear = leavingDate.getFullYear();
      const diffYears = Math.max(0, leavYear - admYear);
      const yearsStudied = (proposed.yearsStudied as string) || `${admYear} – ${leavYear} (${diffYears} ${diffYears === 1 ? "Year" : "Years"})`;

      const tcNumber = (proposed.tcNumber as string) || (await generateTCNumber(leavYear));
      const traceCode = (proposed.traceCode as string) || `TC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      await prisma.$transaction(async (tx) => {
        const existingTC = await tx.transferCertificateRecord.findUnique({
          where: { tcNumber },
        });

        if (existingTC) {
          await tx.transferCertificateRecord.update({
            where: { id: existingTC.id },
            data: {
              leavingClass,
              leavingDate,
              reasonForLeaving,
              conduct,
              promotedTo,
              feeDuesStatus,
              remarks,
              status: "ISSUED",
            },
          });
        } else {
          await tx.transferCertificateRecord.create({
            data: {
              studentSrNumber: srNumber,
              tcNumber,
              studentName,
              fatherName,
              motherName,
              admissionClass,
              leavingClass,
              admissionDate,
              leavingDate,
              yearsStudied,
              issuedBy: "Director",
              reasonForLeaving,
              conduct,
              promotedTo,
              feeDuesStatus,
              remarks,
              traceCode,
              status: "ISSUED",
            },
          });
        }

        // Freeze student record permanently
        await tx.student.update({
          where: { srNumber },
          data: { recordStatus: "TC_ISSUED" },
        });

        // Mark edit request as APPROVED
        await tx.studentEditRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
      });

      await recordAuditLogAction({
        actionType: "ISSUE_TC",
        studentSrNumber: srNumber,
        prefix: "TC",
        details: {
          requestId,
          tcNumber,
          leavingClass,
          leavingDate: leavingDate.toISOString(),
          promotedTo: promotedTo || "—",
          feeDuesStatus: feeDuesStatus || "NIL",
          status: "TC_ISSUED_FROZEN",
          approvedBy: "Director (Executive Key)",
          timestamp: new Date().toISOString(),
        },
      });

      revalidatePath(`/students/${encodeURIComponent(srNumber)}`);
      revalidatePath(`/students/${encodeURIComponent(srNumber)}/transfer-certificate`);
      revalidatePath("/tc-register");
      revalidatePath("/directory");
      revalidatePath("/registers/data-entry");
      revalidatePath("/approvals");
      revalidatePath("/director-dashboard");
      revalidatePath("/");

      return {
        success: true,
        message: `Transfer Certificate ${tcNumber} approved & issued for Scholar "${srNumber}". Student record is now permanently frozen in TC Register.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update live Student record
      await tx.student.update({
        where: { srNumber },
        data: studentUpdate,
      });

      // 2. Update or Upsert Father if fields provided
      const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
      const effectiveFatherAddress = (proposed.permanentAddress || proposed.currentAddress || proposed.address) as string;
      if (father) {
        const fatherName = proposed.fatherName ? (proposed.fatherName as string) : undefined;
        await tx.parent.update({
          where: { id: father.id },
          data: {
            firstName: fatherName ? (fatherName.split(" ")[0] || father.firstName) : father.firstName,
            lastName: fatherName ? (fatherName.split(" ").slice(1).join(" ") || father.lastName) : father.lastName,
            phoneNumber: (proposed.fatherPhone as string) || father.phoneNumber,
            occupation: (proposed.fatherOccupation as string) || father.occupation,
            educationQualification: (proposed.fatherEducation as string) || father.educationQualification,
            annualIncome: proposed.fatherIncome ? (isNaN(parseFloat(String(proposed.fatherIncome))) ? null : parseFloat(String(proposed.fatherIncome))) : father.annualIncome,
            address: effectiveFatherAddress || father.address,
            aadharNumber: encryptedFatherAadhar !== undefined ? encryptedFatherAadhar : father.aadharNumber,
            panNumber: encryptedParentPan !== undefined ? encryptedParentPan : father.panNumber,
            panCardPath: movedFiles.parentPanCardPath || father.panCardPath,
            fatherPhotoPath: movedFiles.fatherPhotoPath || father.fatherPhotoPath,
            parentPhotoPath: movedFiles.fatherPhotoPath || father.parentPhotoPath,
          },
        });
      } else if (proposed.fatherName || proposed.fatherPhone || proposed.fatherAadhar) {
        const fatherName = (proposed.fatherName as string) || "Father";
        await tx.parent.create({
          data: {
            studentSrNumber: srNumber,
            relationType: "FATHER",
            firstName: fatherName.split(" ")[0] || "Father",
            lastName: fatherName.split(" ").slice(1).join(" ") || "",
            phoneNumber: (proposed.fatherPhone as string) || "",
            occupation: (proposed.fatherOccupation as string) || "",
            educationQualification: (proposed.fatherEducation as string) || "",
            annualIncome: proposed.fatherIncome ? (isNaN(parseFloat(String(proposed.fatherIncome))) ? null : parseFloat(String(proposed.fatherIncome))) : null,
            address: effectiveFatherAddress || "",
            aadharNumber: encryptedFatherAadhar || null,
            panNumber: encryptedParentPan || null,
            panCardPath: movedFiles.parentPanCardPath || null,
            fatherPhotoPath: movedFiles.fatherPhotoPath || null,
            parentPhotoPath: movedFiles.fatherPhotoPath || null,
          },
        });
      }

      // 3. Update or Upsert Mother if fields provided
      const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
      const effectiveMotherAddress = (proposed.permanentAddress || proposed.currentAddress || proposed.address) as string;
      if (mother) {
        const motherName = proposed.motherName ? (proposed.motherName as string) : undefined;
        await tx.parent.update({
          where: { id: mother.id },
          data: {
            firstName: motherName ? (motherName.split(" ")[0] || mother.firstName) : mother.firstName,
            lastName: motherName ? (motherName.split(" ").slice(1).join(" ") || mother.lastName) : mother.lastName,
            phoneNumber: (proposed.motherPhone as string) || mother.phoneNumber,
            occupation: (proposed.motherOccupation as string) || mother.occupation,
            educationQualification: (proposed.motherEducation as string) || mother.educationQualification,
            annualIncome: proposed.motherIncome ? (isNaN(parseFloat(String(proposed.motherIncome))) ? null : parseFloat(String(proposed.motherIncome))) : mother.annualIncome,
            address: effectiveMotherAddress || mother.address,
            aadharNumber: encryptedMotherAadhar !== undefined ? encryptedMotherAadhar : mother.aadharNumber,
            panNumber: encryptedParentPan !== undefined ? encryptedParentPan : mother.panNumber,
            panCardPath: movedFiles.parentPanCardPath || mother.panCardPath,
            motherPhotoPath: movedFiles.motherPhotoPath || mother.motherPhotoPath,
            parentPhotoPath: movedFiles.motherPhotoPath || mother.parentPhotoPath,
          },
        });
      } else if (proposed.motherName || proposed.motherPhone || proposed.motherAadhar) {
        const motherName = (proposed.motherName as string) || "Mother";
        await tx.parent.create({
          data: {
            studentSrNumber: srNumber,
            relationType: "MOTHER",
            firstName: motherName.split(" ")[0] || "Mother",
            lastName: motherName.split(" ").slice(1).join(" ") || "",
            phoneNumber: (proposed.motherPhone as string) || "",
            occupation: (proposed.motherOccupation as string) || "",
            educationQualification: (proposed.motherEducation as string) || "",
            annualIncome: proposed.motherIncome ? (isNaN(parseFloat(String(proposed.motherIncome))) ? null : parseFloat(String(proposed.motherIncome))) : null,
            address: effectiveMotherAddress || "",
            aadharNumber: encryptedMotherAadhar || null,
            panNumber: encryptedParentPan || null,
            panCardPath: movedFiles.parentPanCardPath || null,
            motherPhotoPath: movedFiles.motherPhotoPath || null,
            parentPhotoPath: movedFiles.motherPhotoPath || null,
          },
        });
      }

      // 4. Update Academic Session if class/session provided
      if (proposed.className || proposed.sessionYear) {
        const cls = (proposed.className as string) || (proposed.currentClass as string) || student.currentClass || "Nursery - PP3";
        const yr = (proposed.sessionYear as string) || "2026-2027";
        const latestSession = student.academicSessions[0];
        if (latestSession) {
          await tx.academicSession.update({
            where: { id: latestSession.id },
            data: {
              className: cls,
              sessionYear: yr,
            },
          });
        } else {
          await tx.academicSession.create({
            data: {
              studentSrNumber: srNumber,
              className: cls,
              sessionYear: yr,
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
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/sr-front-page`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/sr-back-page`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/report-cards/pre-primary`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/report-cards/lower-primary`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/report-cards/mid-levels`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/report-cards/class-ix`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/transfer-certificate`);
    revalidatePath(`/students/${encodeURIComponent(srNumber)}/id-card`);
    revalidatePath("/directory");
    revalidatePath("/director-dashboard");
    revalidatePath("/approvals");
    revalidatePath("/registers/data-entry");
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

    let proposed: Record<string, unknown> = {};
    try {
      proposed = JSON.parse(request.proposedData);
    } catch {}

    // Clean up temp files
    const attachedFiles: { fieldName: string; tempPath: string }[] = request.attachedFiles
      ? JSON.parse(request.attachedFiles)
      : [];

    for (const af of attachedFiles) {
      await deleteTempFile(af.tempPath);
    }

    // Mark as REJECTED and restore student status if this was a deletion request
    await prisma.$transaction(async (tx) => {
      await tx.studentEditRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "Rejected by Director",
          reviewedAt: new Date(),
        },
      });

      if (proposed._editType === "DELETE_STUDENT" && request.student?.recordStatus === "PENDING_DELETION") {
        await tx.student.update({
          where: { id: request.student.id },
          data: { recordStatus: "APPROVED" },
        });
      }
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
    revalidatePath("/directory");
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
