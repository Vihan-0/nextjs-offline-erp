import React from "react";
import prisma from "@/lib/prisma";
import {
  DirectorApprovalDashboard,
  PendingStudentItem,
  PendingDeletionItem,
  AuditLedgerItem,
} from "./director-approval-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Director's Approval Dashboard | Town Hall Public High School",
  description:
    "Executive Maker-Checker clearance queue for student admissions, record deletions, marks sign-offs, and universal audit logging.",
};

export default async function DirectorDashboardPage() {
  // 1. Fetch pending admissions/updates, pending deletions, stats, and universal audit logs
  const [
    pendingStudentsRaw,
    pendingDeletionsRaw,
    totalApproved,
    totalRejected,
    recentAuditLogsRaw,
  ] = await Promise.all([
    prisma.student.findMany({
      where: {
        recordStatus: {
          in: ["PENDING", "PENDING_UPDATE"],
        },
      },
      include: {
        academicSessions: {
          orderBy: { createdAt: "desc" },
        },
        parents: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.student.findMany({
      where: {
        recordStatus: "PENDING_DELETION",
      },
      include: {
        academicSessions: {
          orderBy: { createdAt: "desc" },
        },
        parents: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.student.count({
      where: {
        recordStatus: "APPROVED",
      },
    }).catch(() => 0),
    prisma.student.count({
      where: {
        recordStatus: "REJECTED",
      },
    }).catch(() => 0),
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            srNumber: true,
          },
        },
      },
    }).catch(() => []),
  ]);

  const recentAuditLogs: AuditLedgerItem[] = recentAuditLogsRaw.map((log) => ({
    id: log.id,
    actionType: log.actionType,
    studentSrNumber: log.studentSrNumber,
    traceCode: log.traceCode,
    details: log.details,
    timestamp: log.timestamp.toISOString(),
    studentName: log.student ? `${log.student.firstName} ${log.student.lastName}`.trim() : log.studentSrNumber,
  }));

  // Helper serializer for students
  const serializeStudent = (student: typeof pendingStudentsRaw[0]): PendingStudentItem => {
    const latestSession = student.academicSessions[0];
    const father =
      student.parents.find((p) => p.relationType?.toLowerCase() === "father") ||
      student.parents[0];
    const mother = student.parents.find(
      (p) => p.relationType?.toLowerCase() === "mother"
    );

    const dobFormatted = student.dateOfBirth
      ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

    const createdFormatted = student.createdAt
      ? new Date(student.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    return {
      id: student.id,
      srNumber: student.srNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`.trim(),
      dateOfBirth: dobFormatted,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      religion: student.religion,
      category: student.category,
      nationality: student.nationality,
      photoPath: student.photoPath,
      birthCertificatePath: student.birthCertificatePath,
      aadharCardPath: student.aadharCardPath,
      transferCertificatePath: student.transferCertificatePath,
      parentPanCardPath: student.parentPanCardPath || father?.panCardPath || mother?.panCardPath || null,
      fatherPhotoPath: father?.fatherPhotoPath || father?.parentPhotoPath || null,
      motherPhotoPath: mother?.motherPhotoPath || mother?.parentPhotoPath || null,
      parentPhotoPath: father?.parentPhotoPath || mother?.parentPhotoPath || null,
      medicalConditions: student.medicalConditions,
      allergies: student.allergies,
      createdAt: createdFormatted,
      apaarId: student.apaarId,
      recordStatus: student.recordStatus,
      className: latestSession?.className || "NURSERY",
      sessionYear: latestSession?.sessionYear || "2026-2027",
      fatherName: father ? `${father.firstName} ${father.lastName}`.trim() : "",
      fatherPhone: father?.phoneNumber || null,
      fatherOccupation: father?.occupation || null,
      motherName: mother ? `${mother.firstName} ${mother.lastName}`.trim() : "",
      motherPhone: mother?.phoneNumber || null,
      motherOccupation: mother?.occupation || null,
      address: father?.address || mother?.address || null,
    };
  };

  const initialStudents = pendingStudentsRaw.map(serializeStudent);
  const pendingDeletions: PendingDeletionItem[] = pendingDeletionsRaw.map((s) => ({
    ...serializeStudent(s),
    requestedAt: s.updatedAt
      ? new Date(s.updatedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A",
  }));

  return (
    <DirectorApprovalDashboard
      initialStudents={initialStudents}
      pendingDeletions={pendingDeletions}
      stats={{
        pendingAdmissionsCount: initialStudents.length,
        pendingDeletionsCount: pendingDeletions.length,
        approvedCount: totalApproved,
        rejectedCount: totalRejected,
      }}
      recentAuditLogs={recentAuditLogs}
    />
  );
}
