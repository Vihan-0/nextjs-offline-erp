import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StudentTable, StudentDirectoryItem } from './student-table';
import { parseSessionStartYear } from '@/lib/classHierarchy';

export default async function DirectoryPage() {
  // Fetch all enrolled active students (excluding students whose TC has been issued)
  const studentsRaw = await prisma.student.findMany({
    where: {
      recordStatus: { not: "TC_ISSUED" },
    },
    include: {
      academicSessions: {
        orderBy: { createdAt: 'desc' },
      },
      parents: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  // Map database models to the flat structure expected by our Client Component Table
  const students: StudentDirectoryItem[] = studentsRaw.map((s) => {
    const sortedSessions = [...s.academicSessions].sort((a, b) => {
      const yA = parseSessionStartYear(a.sessionYear) ?? 0;
      const yB = parseSessionStartYear(b.sessionYear) ?? 0;
      if (yA !== yB) return yB - yA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const currentSession = sortedSessions[0];

    // Attempt to find Father first, fallback to first parent found
    const father = s.parents.find(p => p.relationType?.toLowerCase() === 'father') || s.parents[0];

    return {
      id: s.id,
      srNumber: s.srNumber,
      fullName: `${s.firstName} ${s.lastName}`.trim(),
      currentClass: s.currentClass || (currentSession ? currentSession.className : (s.admissionClass || 'N/A')),
      fathersName: father ? `${father.firstName} ${father.lastName}`.trim() : 'N/A',
      contactNumber: father?.phoneNumber || 'N/A',
      photoPath: s.photoPath,
      recordStatus: s.recordStatus,
    };
  });

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Master Student Directory</h1>
            <p className="text-stone-500 mt-2 text-sm">Manage and view all enrolled students across all classes.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-800 px-3.5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors border border-stone-300"
            >
              Home
            </Link>
            <Link
              href="/admission"
              className="inline-flex items-center gap-1.5 bg-[#991b1b] hover:bg-[#b91c1c] text-white px-3.5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors"
            >
              New Admission
            </Link>
            <Link
              href="/director-dashboard"
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors border border-stone-800"
            >
              Director's Desk
            </Link>
            <Link
              href="/registers/data-entry"
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors"
            >
              Marks Register
            </Link>
            <Link
              href="/tc-register"
              className="inline-flex items-center gap-1.5 bg-rose-900 hover:bg-rose-800 text-white px-3.5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors"
            >
              TC Register
            </Link>
          </div>
        </div>

        <StudentTable students={students} />
      </div>
    </div>
  );
}
