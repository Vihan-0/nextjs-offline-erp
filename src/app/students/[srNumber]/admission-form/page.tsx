import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { decryptData } from "@/lib/encryption";
import { PrintableAdmissionFormData } from "@/components/documents/BlankAdmissionForm";
import { PrintableAdmissionFormClient } from "@/components/documents/PrintableAdmissionFormClient";
import { getEnclosureUrl } from "@/lib/enclosures";
import { parseSessionStartYear } from "@/lib/classHierarchy";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function EnrolledStudentAdmissionFormPage({ params }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();

  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { srNumber: decodedSrNumber },
        { srNumber: decodedSrNumber.toUpperCase() },
        { srNumber: decodedSrNumber.toLowerCase() },
      ],
    },
    include: {
      parents: true,
      academicSessions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl border border-stone-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Student Record Not Found</h1>
          <p className="text-sm text-stone-500">
            No record found for Scholar Register No.{" "}
            <span className="font-mono font-bold text-stone-800">"{decodedSrNumber}"</span>.
          </p>
          <div className="pt-4 flex justify-center">
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortedSessions = [...student.academicSessions].sort((a, b) => {
    const yA = parseSessionStartYear(a.sessionYear) ?? 0;
    const yB = parseSessionStartYear(b.sessionYear) ?? 0;
    if (yA !== yB) return yA - yB; // Oldest first for admission session
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  const firstSession = sortedSessions[0];

  const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
  const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
  const primaryParent = father || mother || student.parents[0];

  // Decrypt sensitive credentials
  const decryptedStudentAadhar = student.aadharNumber ? decryptData(student.aadharNumber) : null;
  const decryptedFatherAadhar = father?.aadharNumber ? decryptData(father.aadharNumber) : null;
  const decryptedMotherAadhar = mother?.aadharNumber ? decryptData(mother.aadharNumber) : null;
  const rawPan = father?.panNumber || mother?.panNumber || primaryParent?.panNumber;
  const decryptedParentPan = rawPan ? decryptData(rawPan) : null;

  const admissionDateStr = formatDate(student.admissionDate || student.createdAt);
  const dobStr = formatDate(student.dateOfBirth);

  const admissionClass = student.admissionClass || firstSession?.className || "Nursery - PP3";
  const admissionSession = student.admissionSession || firstSession?.sessionYear || "2026-2027";

  const printableData: PrintableAdmissionFormData = {
    srNumber: student.srNumber,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    dateOfBirth: dobStr,
    gender: student.gender,
    bloodGroup: student.bloodGroup || undefined,
    nationality: student.nationality || "Indian",
    religion: student.religion || undefined,
    category: student.category || "General",
    aadharNumber: decryptedStudentAadhar || undefined,
    penNumber: student.penNumber || undefined,
    apaarId: student.apaarId || undefined,
    admissionClass,
    admissionSession,
    admissionDate: admissionDateStr,
    fatherName: father ? `${father.firstName} ${father.lastName}`.trim() : undefined,
    fatherOccupation: father?.occupation || undefined,
    fatherEducation: father?.educationQualification || undefined,
    fatherPhone: father?.phoneNumber || undefined,
    fatherIncome: father?.annualIncome ? `₹ ${father.annualIncome.toLocaleString("en-IN")}` : undefined,
    fatherAadhar: decryptedFatherAadhar || undefined,
    motherName: mother ? `${mother.firstName} ${mother.lastName}`.trim() : undefined,
    motherOccupation: mother?.occupation || undefined,
    motherEducation: mother?.educationQualification || undefined,
    motherPhone: mother?.phoneNumber || undefined,
    motherIncome: student.motherIncome || undefined,
    motherAadhar: decryptedMotherAadhar || undefined,
    parentPan: decryptedParentPan || undefined,
    currentAddress: student.currentAddress || primaryParent?.address || undefined,
    permanentAddress: student.permanentAddress || student.currentAddress || primaryParent?.address || undefined,
    photoUrl: student.photoPath ? getEnclosureUrl(student.photoPath) : null,
    medicalConditions: student.medicalConditions || undefined,
    allergies: student.allergies || undefined,
  };

  return <PrintableAdmissionFormClient student={printableData} />;
}
