import React from "react";
import prisma from "@/lib/prisma";
import { AccumulativeRegisterGrid, RawStudentData } from "@/components/registers/AccumulativeRegisterGrid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accumulative Marks Register | Town Hall Public High School",
  description: "Secure data-entry dashboard and accumulative marks register for all classes.",
};

export default async function AccumulativeRegisterPage() {
  // Fetch all students with their academic sessions, marks, soft skills, and parents
  const students = await prisma.student.findMany({
    include: {
      parents: true,
      academicSessions: {
        orderBy: { createdAt: "desc" },
        include: {
          marks: true,
          softSkills: true,
        },
      },
    },
    orderBy: {
      srNumber: "asc",
    },
  });

  // Map to serializable format for client grid
  const initialStudents: RawStudentData[] = students.map((s) => {
    const father = s.parents.find((p) => p.relationType?.toLowerCase() === "father");
    const mother = s.parents.find((p) => p.relationType?.toLowerCase() === "mother");

    return {
      id: s.id,
      srNumber: s.srNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      dateOfBirth: s.dateOfBirth.toISOString(),
      gender: s.gender,
      bloodGroup: s.bloodGroup,
      distanceFromSchool: s.distanceFromSchool,
      medicalConditions: s.medicalConditions,
      fatherName: father ? `${father.firstName} ${father.lastName}`.trim() : "",
      fatherQualification: father?.educationQualification || null,
      motherName: mother ? `${mother.firstName} ${mother.lastName}`.trim() : "",
      motherQualification: mother?.educationQualification || null,
      sessions: s.academicSessions.map((sess) => ({
        id: sess.id,
        sessionYear: sess.sessionYear,
        className: sess.className,
        section: sess.section,
        rollNumber: sess.rollNumber,
        totalMeetingsPresent: sess.totalMeetingsPresent,
        totalMeetings: sess.totalMeetings,
        halfYearlyAttendance: sess.halfYearlyAttendance,
        annualAttendance: sess.annualAttendance,
        annualTotalDays: sess.annualTotalDays,
        resultStatus: sess.resultStatus,
        marks: sess.marks.map((m) => ({
          id: m.id,
          subjectName: m.subjectName,
          examType: m.examType,
          oralMarksObtained: m.oralMarksObtained,
          writtenMarksObtained: m.writtenMarksObtained,
          totalMarksObtained: m.totalMarksObtained,
          grade: m.grade,
        })),
        softSkills: sess.softSkills.map((sk) => ({
          id: sk.id,
          skillName: sk.skillName,
          term: sk.term,
          grade: sk.grade,
          remarks: sk.remarks,
        })),
      })),
    };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 vector-grid-lines pb-20">
      <AccumulativeRegisterGrid initialStudents={initialStudents} />
    </div>
  );
}
