import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getReportCardPathForClass } from "@/lib/classHierarchy";

interface PageProps {
  params: Promise<{
    srNumber: string;
  }>;
}

export default async function StudentReportCardDispatcherPage({ params }: PageProps) {
  const { srNumber } = await params;
  const cleanSr = decodeURIComponent(srNumber).trim().toUpperCase();

  const student = await prisma.student.findUnique({
    where: { srNumber: cleanSr },
    include: {
      academicSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) {
    redirect(`/students/${encodeURIComponent(cleanSr)}`);
  }

  const activeClass = student.currentClass || student.academicSessions[0]?.className || "Nursery - PP3";
  const reportCard = getReportCardPathForClass(activeClass);
  redirect(`/students/${encodeURIComponent(cleanSr)}/report-cards/${reportCard.path}`);
}
