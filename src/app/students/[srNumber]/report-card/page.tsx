import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

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

  const className = student.academicSessions[0]?.className?.toUpperCase() || "CLASS V";

  // Tier 1: Pre-Primary (Nursery, LKG, UKG)
  if (/NURSERY|L\.?K\.?G|U\.?K\.?G|PRE[- ]?PRIMARY/i.test(className)) {
    redirect(`/students/${encodeURIComponent(cleanSr)}/report-cards/pre-primary`);
  }

  // Tier 2: Lower Primary (Class I - II)
  if (/CLASS\s*(I|II|1|2)\b/i.test(className) && !/CLASS\s*(IX|III|IV|VII|VIII|10|11|12)/i.test(className)) {
    redirect(`/students/${encodeURIComponent(cleanSr)}/report-cards/lower-primary`);
  }

  // Tier 5: Class IX-X
  if (/CLASS\s*(IX|X|9|10)\b/i.test(className)) {
    redirect(`/students/${encodeURIComponent(cleanSr)}/report-cards/class-ix`);
  }

  // Tier 3 & 4: Mid-Levels (Upper Primary III-V & Junior VI-VIII)
  redirect(`/students/${encodeURIComponent(cleanSr)}/report-cards/mid-levels`);
}
