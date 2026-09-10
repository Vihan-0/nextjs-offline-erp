"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Eye,
  Filter,
  CreditCard,
  FileCheck2,
  BookOpen,
  Award,
  Download,
  User,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Edit3,
} from "lucide-react";
import { deleteStudentAction } from "@/actions/student";
import { getEnclosureUrl } from "@/lib/enclosures";
import { getReportCardPathForClass } from "@/lib/classHierarchy";
import { EditStudentModal, StudentEditData } from "@/components/students/EditStudentModal";

export type StudentDirectoryItem = {
  id: string;
  srNumber: string;
  fullName: string;
  currentClass: string;
  fathersName: string;
  contactNumber: string;
  photoPath: string | null;
  recordStatus?: string;
};

interface StudentTableProps {
  students: StudentDirectoryItem[];
}

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<StudentDirectoryItem | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentEditData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Extract unique classes for the filter dropdown
  const availableClasses = useMemo(() => {
    const classes = new Set(students.map((s) => s.currentClass).filter(Boolean));
    return ["All", ...Array.from(classes)].sort();
  }, [students]);

  // Filter students based on search and class filter
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.srNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fathersName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.contactNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = classFilter === "All" || student.currentClass === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, classFilter]);

  // Handle student delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteStatus(null);

    try {
      const result = await deleteStudentAction(deleteTarget.srNumber);
      if (result.success) {
        setDeleteStatus({ success: true, message: result.message as string });
        setTimeout(() => {
          setDeleteTarget(null);
          setDeleteStatus(null);
          router.refresh();
        }, 1200);
      } else {
        setDeleteStatus({ success: false, message: result.error || "Failed to delete student." });
      }
    } catch (err) {
      setDeleteStatus({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred during deletion.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = ["Scholar Number,Student Name,Class,Father's Name,Contact Number\n"];
    const rows = filteredStudents.map((s) =>
      `"${s.srNumber}","${s.fullName}","${s.currentClass || ''}","${s.fathersName || ''}","${s.contactNumber || ''}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `TownHall_Students_${classFilter.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-zinc-900/90 rounded-3xl shadow-xl border border-zinc-800 overflow-hidden flex flex-col h-[calc(100vh-180px)] relative">
        <span className="absolute top-3 right-3 text-zinc-700 font-mono text-xs select-none">+</span>

        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center z-10">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, SR no, father, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === "All" ? "All Classes" : cls}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-colors border border-zinc-700 cursor-pointer"
              title="Export Current View to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur-xs z-10 text-zinc-400 font-mono uppercase text-[11px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">SR No.</th>
                <th className="px-5 py-3.5">Scholar Name</th>
                <th className="px-5 py-3.5">Current Class</th>
                <th className="px-5 py-3.5">Father's Name</th>
                <th className="px-5 py-3.5">Contact No.</th>
                <th className="px-5 py-3.5 text-right">Actions & Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500">
                    No scholars found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const reportCard = getReportCardPathForClass(student.currentClass);

                  return (
                    <tr key={student.id} className="hover:bg-zinc-800/40 transition-colors group">
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                        {student.srNumber}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 text-zinc-500 font-bold">
                            {student.photoPath ? (
                              <img
                                src={getEnclosureUrl(student.photoPath)}
                                alt={student.fullName}
                                className="w-full h-full object-cover block"
                              />
                            ) : (
                              student.fullName.charAt(0)
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-100 uppercase font-serif">
                              {student.fullName}
                            </span>
                            {student.recordStatus === "PENDING_DELETION" && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/80">
                                Pending Deletion Clearance
                              </span>
                            )}
                            {student.recordStatus === "PENDING" && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
                                Pending Admission Clearance
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono text-[11px] border border-zinc-800">
                          {student.currentClass || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-zinc-400 uppercase">
                        {student.fathersName || "—"}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-zinc-400">
                        {student.contactNumber || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Class-Aware Active Report Card Link */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}/report-cards/${reportCard.path}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-colors ${reportCard.color}`}
                            title={`Generate ${reportCard.label}`}
                          >
                            <FileCheck2 className="w-3 h-3" />
                            <span>{reportCard.label}</span>
                          </Link>

                          {/* Transfer Certificate */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}/transfer-certificate`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-red-300 bg-red-950/60 border border-red-800/60 rounded-lg hover:bg-red-900/60 transition-colors"
                            title="Generate Official Transfer Certificate (T.C.)"
                          >
                            <Award className="w-3 h-3" />
                            <span>T.C.</span>
                          </Link>

                          {/* S.R. Front Page */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}/sr-front-page`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg hover:bg-amber-900/60 transition-colors"
                            title="Generate Scholar Register (S.R.) Front Folio"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Front</span>
                          </Link>

                          {/* S.R. Back Page */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}/sr-back-page`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/60 transition-colors"
                            title="Generate Scholar Register 10-Year Progression Folio"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Back</span>
                          </Link>

                          {/* ID Card */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}/id-card`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 rounded-lg hover:bg-purple-900/60 transition-colors"
                            title="Generate & Print Student ID Card"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>ID</span>
                          </Link>

                          {/* Full Profile View */}
                          <Link
                            href={`/students/${encodeURIComponent(student.srNumber)}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
                            title="View Full Scholar Profile"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Dossier</span>
                          </Link>

                          {/* Quick Edit Scholar Details */}
                          <button
                            type="button"
                            onClick={() => {
                              const parts = student.fullName.trim().split(" ");
                              const fName = parts[0] || "";
                              const lName = parts.slice(1).join(" ") || "";
                              setEditingStudent({
                                srNumber: student.srNumber,
                                firstName: fName,
                                lastName: lName,
                                className: student.currentClass,
                                fatherName: student.fathersName,
                                fatherPhone: student.contactNumber,
                                photoPath: student.photoPath,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10.5px] font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors cursor-pointer"
                            title="Edit Scholar Name & Details"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Scholar Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteStatus(null);
                              setDeleteTarget(student);
                            }}
                            className="inline-flex items-center gap-1 p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/60"
                            title={`Delete ${student.fullName} from database`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer stats */}
        <div className="bg-zinc-900 px-6 py-3 border-t border-zinc-800 text-xs text-zinc-400 flex justify-between items-center">
          <span>Showing <strong>{filteredStudents.length}</strong> of {students.length} registered scholars</span>
          <span className="font-mono text-[11px] text-zinc-500">Town Hall Public High School • Master Directory</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                  Confirm Student Deletion
                </h3>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Are you sure you want to request deletion for scholar:
              </p>
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1 font-mono">
                <div className="text-zinc-100 font-bold text-sm">
                  {deleteTarget.fullName}
                </div>
                <div className="text-amber-400 text-xs">
                  S.R. Number: {deleteTarget.srNumber}
                </div>
                <div className="text-zinc-400 text-xs">
                  Class: {deleteTarget.currentClass || "—"} • Father: {deleteTarget.fathersName || "—"}
                </div>
              </div>
              <p className="text-amber-300/90 text-[11px] bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                🛡️ <strong>Maker-Checker Policy:</strong> This action will be submitted to the <strong>Director's Approval Dashboard</strong> for executive review and confirmation before permanent removal from the database.
              </p>
            </div>

            {deleteStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  deleteStatus.success
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                    : "bg-rose-950/60 text-rose-300 border-rose-800/60"
                }`}
              >
                {deleteStatus.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Submit Deletion Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </>
  );
}
