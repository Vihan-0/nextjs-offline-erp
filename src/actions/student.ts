"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { admissionSchema } from "@/lib/validations/student";
import { encryptData } from "@/lib/encryption";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { verifyDirectorSession } from "./auth";
import { recordAuditLogAction } from "./audit";

// Helper to save sensitive file enclosures to private offline storage
async function saveFile(file: unknown): Promise<string | null> {
  if (!file || typeof file === "string" || !(file instanceof Blob) || file.size === 0) {
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Private storage directory outside public web root
    const enclosuresDir = path.join(process.cwd(), "storage", "enclosures");

    // Ensure directory exists
    try {
      await fs.access(enclosuresDir);
    } catch {
      await fs.mkdir(enclosuresDir, { recursive: true });
    }

    const rawName = (file as { name?: string }).name || "enclosure";
    const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanName}`;
    const filePath = path.join(enclosuresDir, filename);

    await fs.writeFile(filePath, buffer);

    // Return the clean filename for secure authenticated streaming
    return filename;
  } catch (err) {
    console.error("Error saving secure file enclosure:", err);
    return null;
  }
}

export async function createStudentAction(formData: FormData) {
  try {
    // 1. Extract and validate string fields
    const rawData = {
      srNumber: formData.get("srNumber"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      bloodGroup: formData.get("bloodGroup") || undefined,
      distanceFromSchool: formData.get("distanceFromSchool") || undefined,
      religion: formData.get("religion") || undefined,
      category: formData.get("category") || undefined,
      nationality: formData.get("nationality") || undefined,
      medicalConditions: formData.get("medicalConditions") || undefined,
      allergies: formData.get("allergies") || undefined,
      fatherName: formData.get("fatherName"),
      fatherOccupation: formData.get("fatherOccupation") || undefined,
      fatherEducation: formData.get("fatherEducation") || undefined,
      fatherPhone: formData.get("fatherPhone") || undefined,
      fatherIncome: formData.get("fatherIncome") || undefined,
      motherName: formData.get("motherName"),
      motherOccupation: formData.get("motherOccupation") || undefined,
      motherEducation: formData.get("motherEducation") || undefined,
      motherPhone: formData.get("motherPhone") || undefined,
      address: formData.get("address"),
      parentPan: formData.get("parentPan") || undefined,
      className: formData.get("className") || "NURSERY",
      sessionYear: formData.get("sessionYear") || "2026-2027",
    };

    const validatedData = admissionSchema.parse(rawData);

    // Check for duplicate S.R. number
    const existingStudent = await prisma.student.findUnique({
      where: { srNumber: validatedData.srNumber.trim().toUpperCase() },
    });

    if (existingStudent) {
      return {
        success: false,
        error: `Scholar with S.R. Number "${validatedData.srNumber.trim().toUpperCase()}" already exists in the database.`,
      };
    }

    // 2. Handle files asynchronously in parallel (including separate father/mother/pancard photos)
    const [
      photoPath,
      birthCertificatePath,
      aadharCardPath,
      transferCertificatePath,
      fatherPhotoPath,
      motherPhotoPath,
      parentPanCardPath,
      parentPhotoPath,
    ] = await Promise.all([
      saveFile(formData.get("photo")),
      saveFile(formData.get("birthCertificate")),
      saveFile(formData.get("aadharCard")),
      saveFile(formData.get("transferCertificate")),
      saveFile(formData.get("fatherPhoto")),
      saveFile(formData.get("motherPhoto")),
      saveFile(formData.get("parentPanCard")),
      saveFile(formData.get("parentPhoto")),
    ]);

    // Encrypt sensitive parent PAN number before storage
    const encryptedPan = validatedData.parentPan && validatedData.parentPan.trim()
      ? encryptData(validatedData.parentPan.trim().toUpperCase())
      : null;

    // 3. Save to database using Prisma transaction
    const student = await prisma.student.create({
      data: {
        srNumber: validatedData.srNumber.trim().toUpperCase(),
        firstName: validatedData.firstName.toUpperCase().trim(),
        lastName: validatedData.lastName.toUpperCase().trim(),
        dateOfBirth: new Date(validatedData.dateOfBirth),
        gender: validatedData.gender,
        bloodGroup: validatedData.bloodGroup || null,
        distanceFromSchool: validatedData.distanceFromSchool
          ? parseFloat(validatedData.distanceFromSchool)
          : null,
        religion: validatedData.religion || null,
        category: validatedData.category || null,
        nationality: validatedData.nationality || "Indian",
        photoPath,
        birthCertificatePath,
        aadharCardPath,
        transferCertificatePath,
        parentPanCardPath: parentPanCardPath || null,
        medicalConditions: validatedData.medicalConditions || null,
        allergies: validatedData.allergies || null,
        recordStatus: "PENDING", // Maker-Checker clearance queue
        academicSessions: {
          create: [
            {
              sessionYear: validatedData.sessionYear || "2026-2027",
              className: validatedData.className || "NURSERY",
              resultStatus: "Enrolled",
            },
          ],
        },
        parents: {
          create: [
            {
              relationType: "Father",
              firstName: validatedData.fatherName.split(" ")[0] || "",
              lastName: validatedData.fatherName.split(" ").slice(1).join(" ") || "",
              occupation: validatedData.fatherOccupation || null,
              educationQualification: validatedData.fatherEducation || null,
              phoneNumber: validatedData.fatherPhone || null,
              annualIncome: validatedData.fatherIncome
                ? parseFloat(validatedData.fatherIncome)
                : null,
              address: validatedData.address,
              panNumber: encryptedPan,
              panCardPath: parentPanCardPath || null,
              fatherPhotoPath: fatherPhotoPath || parentPhotoPath || null,
              parentPhotoPath: fatherPhotoPath || parentPhotoPath || null,
            },
            {
              relationType: "Mother",
              firstName: validatedData.motherName.split(" ")[0] || "",
              lastName: validatedData.motherName.split(" ").slice(1).join(" ") || "",
              occupation: validatedData.motherOccupation || null,
              educationQualification: validatedData.motherEducation || null,
              phoneNumber: validatedData.motherPhone || null,
              address: validatedData.address,
              panNumber: encryptedPan,
              panCardPath: parentPanCardPath || null,
              motherPhotoPath: motherPhotoPath || parentPhotoPath || null,
              parentPhotoPath: motherPhotoPath || parentPhotoPath || null,
            },
          ],
        },
      },
      include: {
        academicSessions: true,
        parents: true,
      },
    });

    // 4. Record audit log for Maker-Checker admission queue
    await recordAuditLogAction({
      actionType: "ADMISSION_SUBMITTED",
      studentSrNumber: student.srNumber,
      prefix: "ADM",
      details: {
        admittedClass: validatedData.className || "NURSERY",
        sessionYear: validatedData.sessionYear || "2026-2027",
        submittedAt: new Date().toISOString(),
        status: "PENDING_DIRECTOR_CLEARANCE",
      },
    });

    revalidatePath("/admission");
    revalidatePath("/directory");
    revalidatePath("/");
    revalidatePath("/registers/data-entry");
    revalidatePath("/director-dashboard");

    return {
      success: true,
      message: `Student ${student.firstName} ${student.lastName} (S.R. No: ${student.srNumber}) registered! Awaiting Director clearance in Maker-Checker queue.`,
      data: {
        srNumber: student.srNumber,
        fullName: `${student.firstName} ${student.lastName}`.trim(),
        className: validatedData.className || "NURSERY",
        sessionYear: validatedData.sessionYear || "2026-2027",
        id: student.id,
      },
    };
  } catch (error: unknown) {
    console.error("Failed to create student:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation failed." };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save student record. Please check your inputs and try again.",
    };
  }
}

/**
 * Handles student deletion with Maker-Checker governance.
 * If Director is authenticated, executes permanent cascade deletion.
 * If standard staff, queues deletion as PENDING_DELETION for Director confirmation.
 */
export async function deleteStudentAction(srNumber: string, reason?: string) {
  try {
    if (!srNumber || !srNumber.trim()) {
      return { success: false, error: "Scholar Register Number is required for deletion." };
    }

    const cleanSr = srNumber.trim().toUpperCase();

    // Verify student exists
    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { srNumber: cleanSr },
          { srNumber: cleanSr.toLowerCase() },
          { srNumber: srNumber.trim() },
        ],
      },
    });

    if (!existing) {
      return { success: false, error: `Student with S.R. Number "${cleanSr}" not found in database.` };
    }

    const isDirector = await verifyDirectorSession();

    if (isDirector) {
      // Director session active: execute permanent cascade deletion
      await prisma.student.delete({
        where: { id: existing.id },
      });

      revalidatePath("/directory");
      revalidatePath("/");
      revalidatePath("/registers/data-entry");
      revalidatePath("/director-dashboard");

      return {
        success: true,
        message: `Director authorization granted: Scholar "${cleanSr}" (${existing.firstName} ${existing.lastName}) has been permanently deleted from the database.`,
      };
    } else {
      // Maker-Checker: Mark as PENDING_DELETION and notify Director's Dashboard
      await prisma.student.update({
        where: { id: existing.id },
        data: { recordStatus: "PENDING_DELETION" },
      });

      await recordAuditLogAction({
        actionType: "STUDENT_DELETION_REQUESTED",
        studentSrNumber: cleanSr,
        prefix: "DEL",
        details: {
          requestedAt: new Date().toISOString(),
          reason: reason || "Staff requested permanent record removal",
          studentName: `${existing.firstName} ${existing.lastName}`.trim(),
        },
      });

      revalidatePath("/directory");
      revalidatePath("/");
      revalidatePath("/registers/data-entry");
      revalidatePath("/director-dashboard");

      return {
        success: true,
        message: `Deletion request for Scholar "${cleanSr}" (${existing.firstName} ${existing.lastName}) has been submitted to the Director's Dashboard for Maker-Checker confirmation.`,
      };
    }
  } catch (error: unknown) {
    console.error("Failed to process student deletion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process student deletion.",
    };
  }
}

/**
 * Handles updating student details with Maker-Checker governance.
 * Allows fixing misspelled names, updating demographics, parent information, and document enclosures.
 * If Director is authenticated, immediately applies changes.
 * If standard staff, marks record as PENDING_UPDATE for Director clearance.
 */
export async function updateStudentAction(formData: FormData) {
  try {
    const srNumber = formData.get("srNumber")?.toString().trim().toUpperCase();
    if (!srNumber) {
      return { success: false, error: "Scholar Register Number is required." };
    }

    const existingStudent = await prisma.student.findUnique({
      where: { srNumber },
      include: {
        parents: true,
        academicSessions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!existingStudent) {
      return { success: false, error: `Student with S.R. Number "${srNumber}" not found.` };
    }

    // Extract updated fields
    const firstName = formData.get("firstName")?.toString().trim().toUpperCase() || existingStudent.firstName;
    const lastName = formData.get("lastName")?.toString().trim().toUpperCase() || existingStudent.lastName;
    const dobRaw = formData.get("dateOfBirth")?.toString();
    const dateOfBirth = dobRaw ? new Date(dobRaw) : existingStudent.dateOfBirth;
    const gender = formData.get("gender")?.toString() || existingStudent.gender;
    const bloodGroup = formData.get("bloodGroup")?.toString() || existingStudent.bloodGroup;
    const religion = formData.get("religion")?.toString() || existingStudent.religion;
    const category = formData.get("category")?.toString() || existingStudent.category;
    const nationality = formData.get("nationality")?.toString() || existingStudent.nationality;
    const medicalConditions = formData.get("medicalConditions")?.toString() || existingStudent.medicalConditions;
    const allergies = formData.get("allergies")?.toString() || existingStudent.allergies;
    const distRaw = formData.get("distanceFromSchool")?.toString();
    const distanceFromSchool = distRaw ? parseFloat(distRaw) : existingStudent.distanceFromSchool;

    // Parent information
    const fatherName = formData.get("fatherName")?.toString().trim();
    const fatherPhone = formData.get("fatherPhone")?.toString().trim();
    const fatherOccupation = formData.get("fatherOccupation")?.toString().trim();
    const fatherEducation = formData.get("fatherEducation")?.toString().trim();
    const fatherIncomeRaw = formData.get("fatherIncome")?.toString();
    const fatherIncome = fatherIncomeRaw ? parseFloat(fatherIncomeRaw) : undefined;

    const motherName = formData.get("motherName")?.toString().trim();
    const motherPhone = formData.get("motherPhone")?.toString().trim();
    const motherOccupation = formData.get("motherOccupation")?.toString().trim();
    const motherEducation = formData.get("motherEducation")?.toString().trim();

    const address = formData.get("address")?.toString().trim();
    const className = formData.get("className")?.toString().trim();
    const sessionYear = formData.get("sessionYear")?.toString().trim();

    // Check for new file enclosures
    const [
      newPhoto,
      newBirthCert,
      newAadhar,
      newTC,
      newFatherPhoto,
      newMotherPhoto,
      newPanCard,
    ] = await Promise.all([
      saveFile(formData.get("photo")),
      saveFile(formData.get("birthCertificate")),
      saveFile(formData.get("aadharCard")),
      saveFile(formData.get("transferCertificate")),
      saveFile(formData.get("fatherPhoto")),
      saveFile(formData.get("motherPhoto")),
      saveFile(formData.get("parentPanCard")),
    ]);

    const isDirector = await verifyDirectorSession();
    const newRecordStatus = isDirector ? "APPROVED" : "PENDING_UPDATE";

    // Update in database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update Student record
      await tx.student.update({
        where: { srNumber },
        data: {
          firstName,
          lastName,
          dateOfBirth,
          gender,
          bloodGroup,
          distanceFromSchool,
          religion,
          category,
          nationality,
          medicalConditions,
          allergies,
          recordStatus: newRecordStatus,
          photoPath: newPhoto || existingStudent.photoPath,
          birthCertificatePath: newBirthCert || existingStudent.birthCertificatePath,
          aadharCardPath: newAadhar || existingStudent.aadharCardPath,
          transferCertificatePath: newTC || existingStudent.transferCertificatePath,
          parentPanCardPath: newPanCard || existingStudent.parentPanCardPath,
        },
      });

      // 2. Update/Upsert Father Record
      const father = existingStudent.parents.find((p) => p.relationType?.toLowerCase() === "father");
      if (father) {
        await tx.parent.update({
          where: { id: father.id },
          data: {
            firstName: fatherName ? fatherName.split(" ")[0] : father.firstName,
            lastName: fatherName ? fatherName.split(" ").slice(1).join(" ") : father.lastName,
            phoneNumber: fatherPhone !== undefined ? fatherPhone : father.phoneNumber,
            occupation: fatherOccupation !== undefined ? fatherOccupation : father.occupation,
            educationQualification: fatherEducation !== undefined ? fatherEducation : father.educationQualification,
            annualIncome: fatherIncome !== undefined ? fatherIncome : father.annualIncome,
            address: address !== undefined ? address : father.address,
            panCardPath: newPanCard || father.panCardPath,
            fatherPhotoPath: newFatherPhoto || father.fatherPhotoPath,
            parentPhotoPath: newFatherPhoto || father.parentPhotoPath,
          },
        });
      } else if (fatherName) {
        await tx.parent.create({
          data: {
            studentSrNumber: srNumber,
            relationType: "Father",
            firstName: fatherName.split(" ")[0] || "",
            lastName: fatherName.split(" ").slice(1).join(" ") || "",
            phoneNumber: fatherPhone || null,
            occupation: fatherOccupation || null,
            educationQualification: fatherEducation || null,
            annualIncome: fatherIncome || null,
            address: address || null,
            panCardPath: newPanCard || null,
            fatherPhotoPath: newFatherPhoto || null,
            parentPhotoPath: newFatherPhoto || null,
          },
        });
      }

      // 3. Update/Upsert Mother Record
      const mother = existingStudent.parents.find((p) => p.relationType?.toLowerCase() === "mother");
      if (mother) {
        await tx.parent.update({
          where: { id: mother.id },
          data: {
            firstName: motherName ? motherName.split(" ")[0] : mother.firstName,
            lastName: motherName ? motherName.split(" ").slice(1).join(" ") : mother.lastName,
            phoneNumber: motherPhone !== undefined ? motherPhone : mother.phoneNumber,
            occupation: motherOccupation !== undefined ? motherOccupation : mother.occupation,
            educationQualification: motherEducation !== undefined ? motherEducation : mother.educationQualification,
            address: address !== undefined ? address : mother.address,
            panCardPath: newPanCard || mother.panCardPath,
            motherPhotoPath: newMotherPhoto || mother.motherPhotoPath,
            parentPhotoPath: newMotherPhoto || mother.parentPhotoPath,
          },
        });
      } else if (motherName) {
        await tx.parent.create({
          data: {
            studentSrNumber: srNumber,
            relationType: "Mother",
            firstName: motherName.split(" ")[0] || "",
            lastName: motherName.split(" ").slice(1).join(" ") || "",
            phoneNumber: motherPhone || null,
            occupation: motherOccupation || null,
            educationQualification: motherEducation || null,
            address: address || null,
            panCardPath: newPanCard || null,
            motherPhotoPath: newMotherPhoto || null,
            parentPhotoPath: newMotherPhoto || null,
          },
        });
      }

      // 4. Update Academic Session if provided
      if (className || sessionYear) {
        const latestSession = existingStudent.academicSessions[0];
        if (latestSession) {
          await tx.academicSession.update({
            where: { id: latestSession.id },
            data: {
              className: className || latestSession.className,
              sessionYear: sessionYear || latestSession.sessionYear,
            },
          });
        }
      }
    });

    // Record Audit Log
    await recordAuditLogAction({
      actionType: isDirector ? "DIRECTOR_STUDENT_UPDATED" : "STUDENT_UPDATE_REQUESTED",
      studentSrNumber: srNumber,
      prefix: isDirector ? "EDT-OK" : "EDT-REQ",
      details: {
        studentSrNumber: srNumber,
        fullName: `${firstName} ${lastName}`,
        updatedBy: isDirector ? "Director (Executive Key)" : "Staff Faculty",
        status: isDirector ? "APPROVED_IMMEDIATELY" : "PENDING_DIRECTOR_APPROVAL",
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath(`/students/${encodeURIComponent(srNumber)}`);
    revalidatePath("/directory");
    revalidatePath("/director-dashboard");
    revalidatePath("/registers/data-entry");
    revalidatePath("/");

    return {
      success: true,
      message: isDirector
        ? `Scholar "${srNumber}" (${firstName} ${lastName}) details updated immediately with Director Master Authorization.`
        : `Scholar "${srNumber}" (${firstName} ${lastName}) update request submitted to Director's Governance Desk for Maker-Checker approval.`,
    };
  } catch (error: unknown) {
    console.error("Failed to update student details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update student details.",
    };
  }
}
