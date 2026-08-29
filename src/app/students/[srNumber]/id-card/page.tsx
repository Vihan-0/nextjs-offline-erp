import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getEnclosureUrl } from "@/lib/enclosures";
import { StudentIDCardClient } from "@/components/documents/StudentIDCardClient";
import { type StudentIDCardData } from "@/components/documents/StudentIDCard";
import { AlertCircle, ArrowLeft, PlusCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
}

// Helper to format Date of Birth to DD.MM.YYYY matching reference template
function formatDateOfBirth(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export default async function StudentIDCardPage({ params }: PageProps) {
  const { srNumber } = await params;
  const decodedSrNumber = decodeURIComponent(srNumber).trim();

  // Fetch student with related parents and latest academic session
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl border border-stone-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Student Not Found</h1>
          <p className="text-sm text-stone-500">
            No student record exists with Scholar Register Number{" "}
            <span className="font-semibold text-stone-800 font-mono">
              "{decodedSrNumber}"
            </span>
            .
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/directory"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Link>
            <Link
              href="/admission"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              New Admission
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract Parents
  const father = student.parents.find(
    (p) => p.relationType?.toLowerCase() === "father"
  );
  const mother = student.parents.find(
    (p) => p.relationType?.toLowerCase() === "mother"
  );

  const fatherName = father
    ? `${father.firstName} ${father.lastName}`.trim()
    : "—";
  const motherName = mother
    ? `${mother.firstName} ${mother.lastName}`.trim()
    : "—";

  // Primary Contact & Address
  const primaryParent = father || mother || student.parents[0];
  const mobile =
    primaryParent?.phoneNumber ||
    father?.phoneNumber ||
    mother?.phoneNumber ||
    "—";
  const address =
    primaryParent?.address ||
    father?.address ||
    mother?.address ||
    "—";

  // Class and Session
  const latestSession = student.academicSessions[0];
  const className = latestSession?.className || "NURSERY";
  const sessionYear = latestSession?.sessionYear || "2026-2027";

  const cardData: StudentIDCardData = {
    srNumber: student.srNumber,
    fullName: `${student.firstName} ${student.lastName}`.trim(),
    fatherName,
    motherName,
    dateOfBirth: formatDateOfBirth(student.dateOfBirth),
    className,
    mobile,
    address,
    photoUrl: getEnclosureUrl(student.photoPath) || null,
    sessionYear,
    schoolName: "TOWN HALL PUBLIC HIGH SCHOOL",
    schoolTagline: "(A Tradition in Quality Education)",
    schoolAddress: "Kundari Rakabganj, Ramapuram, Lucknow.",
    schoolPhone: "Mob. No.- 9235445596",
  };

  return <StudentIDCardClient student={cardData} />;
}
