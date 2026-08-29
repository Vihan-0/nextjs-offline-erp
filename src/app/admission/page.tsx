"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admissionSchema, type AdmissionFormValues } from "@/lib/validations/student";
import { createStudentAction } from "@/actions/student";
import { useReactToPrint } from "react-to-print";
import {
  Printer,
  Save,
  UserPlus,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  CreditCard,
  Users,
  ArrowRight,
  FileCheck,
  X,
  FileText,
  Loader2,
  Home,
} from "lucide-react";
import { BlankAdmissionForm } from "@/components/documents/BlankAdmissionForm";

const SCHOOL_CLASSES = [
  "NURSERY",
  "LKG",
  "UKG",
  "CLASS I",
  "CLASS II",
  "CLASS III",
  "CLASS IV",
  "CLASS V",
  "CLASS VI",
  "CLASS VII",
  "CLASS VIII",
  "CLASS IX",
  "CLASS X",
];

interface AttachedFile {
  file: File;
  name: string;
  size: string;
  previewUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AdmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdStudent, setCreatedStudent] = useState<{
    srNumber: string;
    fullName: string;
    className: string;
    sessionYear: string;
  } | null>(null);

  // Attached files state with visual marking & thumbnails
  const [attachedFiles, setAttachedFiles] = useState<{
    photo: AttachedFile | null;
    fatherPhoto: AttachedFile | null;
    motherPhoto: AttachedFile | null;
    parentPanCard: AttachedFile | null;
    birthCertificate: AttachedFile | null;
    aadharCard: AttachedFile | null;
    transferCertificate: AttachedFile | null;
  }>({
    photo: null,
    fatherPhoto: null,
    motherPhoto: null,
    parentPanCard: null,
    birthCertificate: null,
    aadharCard: null,
    transferCertificate: null,
  });

  // Hidden printable component reference
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "SR_Front_Page",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      nationality: "Indian",
      gender: "Male",
      className: "CLASS I",
      sessionYear: "2026-2027",
    },
  });

  const handleFileSelect = (
    key: "photo" | "fatherPhoto" | "motherPhoto" | "parentPanCard" | "birthCertificate" | "aadharCard" | "transferCertificate",
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let previewUrl: string | undefined = undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    setAttachedFiles((prev) => ({
      ...prev,
      [key]: {
        file,
        name: file.name,
        size: formatBytes(file.size),
        previewUrl,
      },
    }));
  };

  const handleFileRemove = (
    key: "photo" | "fatherPhoto" | "motherPhoto" | "parentPanCard" | "birthCertificate" | "aadharCard" | "transferCertificate"
  ) => {
    setAttachedFiles((prev) => {
      const existing = prev[key];
      if (existing?.previewUrl) {
        URL.revokeObjectURL(existing.previewUrl);
      }
      return {
        ...prev,
        [key]: null,
      };
    });
    const input = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  const onSubmit = async (data: AdmissionFormValues) => {
    setIsSubmitting(true);
    setMessage(null);
    setCreatedStudent(null);

    try {
      const formData = new FormData();

      // Append validated string fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && typeof value === "string") {
          formData.append(key, value);
        }
      });

      // Append attached files from state
      if (attachedFiles.photo?.file) {
        formData.append("photo", attachedFiles.photo.file);
      }
      if (attachedFiles.fatherPhoto?.file) {
        formData.append("fatherPhoto", attachedFiles.fatherPhoto.file);
      }
      if (attachedFiles.motherPhoto?.file) {
        formData.append("motherPhoto", attachedFiles.motherPhoto.file);
      }
      if (attachedFiles.parentPanCard?.file) {
        formData.append("parentPanCard", attachedFiles.parentPanCard.file);
      }
      if (attachedFiles.birthCertificate?.file) {
        formData.append("birthCertificate", attachedFiles.birthCertificate.file);
      }
      if (attachedFiles.aadharCard?.file) {
        formData.append("aadharCard", attachedFiles.aadharCard.file);
      }
      if (attachedFiles.transferCertificate?.file) {
        formData.append("transferCertificate", attachedFiles.transferCertificate.file);
      }

      const result = await createStudentAction(formData);

      if (result.success && result.data) {
        setMessage({ type: "success", text: result.message as string });
        setCreatedStudent(result.data);
        reset();
        // Clear files state
        setAttachedFiles({
          photo: null,
          fatherPhoto: null,
          motherPhoto: null,
          parentPanCard: null,
          birthCertificate: null,
          aadharCard: null,
          transferCertificate: null,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to submit admission record.",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while saving. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-8 font-sans"
      style={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Section */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-2xl border shadow-sm gap-4"
          style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
              >
                <UserPlus className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
                  New Student Admission
                </h1>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Register scholar demographics, parent records, document proofs & initial academic session.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-100"
              style={{ borderColor: "#cbd5e1", color: "#334155" }}
            >
              <Home className="w-4 h-4 text-stone-700" />
              <span>Home</span>
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-100"
              style={{ borderColor: "#cbd5e1", color: "#334155" }}
            >
              <Users className="w-4 h-4" />
              <span>Directory</span>
            </Link>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-100"
              style={{ borderColor: "#cbd5e1", color: "#334155" }}
            >
              <Printer className="w-4 h-4" />
              <span>Print Blank Form</span>
            </button>
          </div>
        </div>

        {/* Celebratory Success Banner with Direct Action Links */}
        {createdStudent && (
          <div
            className="p-6 rounded-2xl border-2 shadow-md space-y-4"
            style={{
              backgroundColor: "#ecfdf5",
              borderColor: "#10b981",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black" style={{ color: "#065f46" }}>
                    Student Record Successfully Created & Saved to Permanent Database!
                  </h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: "#d1fae5",
                      color: "#065f46",
                      borderColor: "#6ee7b7",
                    }}
                  >
                    Active in SQLite
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#047857" }}>
                  Scholar <strong>{createdStudent.fullName}</strong> is now officially registered under Scholar Number <strong className="font-mono">{createdStudent.srNumber}</strong> for Class <strong>{createdStudent.className}</strong> ({createdStudent.sessionYear}).
                </p>
              </div>
            </div>

            {/* Instant Jumps */}
            <div className="pt-2 border-t flex flex-wrap items-center gap-2.5" style={{ borderColor: "#a7f3d0" }}>
              <Link
                href={`/students/${encodeURIComponent(createdStudent.srNumber)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0f2e60", color: "#ffffff" }}
              >
                <Users className="w-4 h-4" />
                <span>View Student Profile</span>
              </Link>

              <Link
                href={`/students/${encodeURIComponent(createdStudent.srNumber)}/sr-front-page`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#b45309", color: "#ffffff" }}
              >
                <BookOpen className="w-4 h-4" />
                <span>Print S.R. Front Folio</span>
              </Link>

              <Link
                href={`/students/${encodeURIComponent(createdStudent.srNumber)}/sr-back-page`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
              >
                <BookOpen className="w-4 h-4" />
                <span>Open S.R. Back Page (10-Yr)</span>
              </Link>

              <Link
                href={`/students/${encodeURIComponent(createdStudent.srNumber)}/id-card`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50"
                style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
              >
                <CreditCard className="w-4 h-4" />
                <span>Print Student ID Card</span>
              </Link>

              <Link
                href="/directory"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50"
                style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
              >
                <span>Go to Master Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setCreatedStudent(null)}
                className="text-xs font-semibold underline px-2 py-1 hover:opacity-75 cursor-pointer"
                style={{ color: "#065f46" }}
              >
                + Register Another Student
              </button>
            </div>
          </div>
        )}

        {/* Error Status Message */}
        {message && message.type === "error" && (
          <div
            className="p-4 rounded-xl flex items-center gap-3 border shadow-xs"
            style={{
              backgroundColor: "#fef2f2",
              borderColor: "#fecdd3",
              color: "#991b1b",
            }}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs">Submission Failed</p>
              <p className="text-xs">{message.text}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 p-6 sm:p-8 rounded-2xl border shadow-sm"
          style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
        >

          {/* A. Student Details Section */}
          <section>
            <h2
              className="text-base font-black border-b pb-2 mb-6 flex items-center justify-between"
              style={{ borderColor: "#f1f5f9", color: "#0f172a" }}
            >
              <span>A. Student Demographics & Academic Class</span>
              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>* Indicates Required</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* S.R. Number */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  S.R. Number (Scholar Reg No.) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("srNumber")}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. SR-2026-104"
                />
                {errors.srNumber && <p className="text-red-500 text-xs mt-1">{errors.srNumber.message}</p>}
              </div>

              {/* Class Admitted To */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Class Admitted To <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("className")}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                >
                  {SCHOOL_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Session */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Academic Session <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("sessionYear")}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. 2026-2027"
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("firstName")}
                  className="w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. NARUTO"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("lastName")}
                  className="w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. UZUMAKI"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("dateOfBirth")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("gender")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Blood Group
                </label>
                <select
                  {...register("bloodGroup")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Category
                </label>
                <select
                  {...register("category")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Religion
                </label>
                <input
                  {...register("religion")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. Hindu / Muslim / Sikh"
                />
              </div>

              {/* Distance */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Distance from School (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register("distanceFromSchool")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="e.g. 2.5"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Nationality
                </label>
                <input
                  {...register("nationality")}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                />
              </div>

              {/* Medical notes */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                    Medical Conditions (if any)
                  </label>
                  <textarea
                    {...register("medicalConditions")}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    placeholder="Any specific medical requirements..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                    Allergies (if any)
                  </label>
                  <textarea
                    {...register("allergies")}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    placeholder="Any known allergies..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* B. Parent Details Section */}
          <section>
            <h2
              className="text-base font-black border-b pb-2 mb-6"
              style={{ borderColor: "#f1f5f9", color: "#0f172a" }}
            >
              B. Parent / Guardian Profiles & Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father */}
              <div
                className="space-y-3.5 p-5 rounded-2xl border"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              >
                <h3 className="font-bold text-xs uppercase" style={{ color: "#0f2e60" }}>
                  Father's Information
                </h3>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                    Father's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("fatherName")}
                    className="w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  />
                  {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Occupation
                    </label>
                    <input
                      {...register("fatherOccupation")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Qualification
                    </label>
                    <input
                      {...register("fatherEducation")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Phone Number
                    </label>
                    <input
                      {...register("fatherPhone")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Annual Income (₹)
                    </label>
                    <input
                      type="number"
                      {...register("fatherIncome")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                </div>
              </div>

              {/* Mother */}
              <div
                className="space-y-3.5 p-5 rounded-2xl border"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              >
                <h3 className="font-bold text-xs uppercase" style={{ color: "#991b1b" }}>
                  Mother's Information
                </h3>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                    Mother's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("motherName")}
                    className="w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  />
                  {errors.motherName && <p className="text-red-500 text-xs mt-1">{errors.motherName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Occupation
                    </label>
                    <input
                      {...register("motherOccupation")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                      Qualification
                    </label>
                    <input
                      {...register("motherEducation")}
                      className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#475569" }}>
                    Phone Number
                  </label>
                  <input
                    {...register("motherPhone")}
                    className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1" style={{ color: "#334155" }}>
                  Permanent Residential Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("address")}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                  placeholder="Full address with city, district and pin code..."
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              {/* Single Parent / Guardian PAN Number */}
              <div
                className="md:col-span-2 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              >
                <div className="space-y-0.5">
                  <label className="block text-xs font-bold" style={{ color: "#334155" }}>
                    Parent / Guardian PAN Number
                  </label>
                  <p className="text-[11px]" style={{ color: "#64748b" }}>
                    Stored with AES-256-CBC field encryption at rest. Will be automatically masked (e.g. XXXXX1234X) on official folios.
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    {...register("parentPan")}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.parentPan && (
                    <p className="text-red-500 text-xs mt-1">{errors.parentPan.message}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* C. Enclosures (Interactive File Uploads with Visual Attached Markings) */}
          <section>
            <div className="flex items-center justify-between border-b pb-2 mb-6" style={{ borderColor: "#f1f5f9" }}>
              <h2 className="text-base font-black" style={{ color: "#0f172a" }}>
                C. Offline Document Enclosures
              </h2>
              <span className="text-xs" style={{ color: "#64748b" }}>
                Files saved securely to offline storage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

              {/* 1. Student Photo */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.photo ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.photo ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.photo ? "solid" : "dashed",
                }}
              >
                {attachedFiles.photo ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs bg-white">
                      {attachedFiles.photo.previewUrl ? (
                        <Image
                          src={attachedFiles.photo.previewUrl}
                          alt="Student Photo"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileCheck className="w-8 h-8 text-emerald-600 m-auto mt-3" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.photo.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.photo.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("photo")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Student Photo
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={(e) => handleFileSelect("photo", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      JPG, PNG (Max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Father's Photo */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.fatherPhoto ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.fatherPhoto ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.fatherPhoto ? "solid" : "dashed",
                }}
              >
                {attachedFiles.fatherPhoto ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs bg-white">
                      {attachedFiles.fatherPhoto.previewUrl ? (
                        <Image
                          src={attachedFiles.fatherPhoto.previewUrl}
                          alt="Father's Photo"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileCheck className="w-8 h-8 text-emerald-600 m-auto mt-3" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.fatherPhoto.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.fatherPhoto.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("fatherPhoto")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Father's Photo
                      <input
                        type="file"
                        name="fatherPhoto"
                        accept="image/*"
                        onChange={(e) => handleFileSelect("fatherPhoto", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      JPG, PNG (Max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Mother's Photo */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.motherPhoto ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.motherPhoto ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.motherPhoto ? "solid" : "dashed",
                }}
              >
                {attachedFiles.motherPhoto ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs bg-white">
                      {attachedFiles.motherPhoto.previewUrl ? (
                        <Image
                          src={attachedFiles.motherPhoto.previewUrl}
                          alt="Mother's Photo"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileCheck className="w-8 h-8 text-emerald-600 m-auto mt-3" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.motherPhoto.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.motherPhoto.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("motherPhoto")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Mother's Photo
                      <input
                        type="file"
                        name="motherPhoto"
                        accept="image/*"
                        onChange={(e) => handleFileSelect("motherPhoto", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      JPG, PNG (Max 5MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Parent PAN Card Document */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.parentPanCard ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.parentPanCard ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.parentPanCard ? "solid" : "dashed",
                }}
              >
                {attachedFiles.parentPanCard ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs bg-white">
                      {attachedFiles.parentPanCard.previewUrl ? (
                        <Image
                          src={attachedFiles.parentPanCard.previewUrl}
                          alt="PAN Card Preview"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileCheck className="w-8 h-8 text-emerald-600 m-auto mt-3" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.parentPanCard.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.parentPanCard.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("parentPanCard")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Parent PAN Card
                      <input
                        type="file"
                        name="parentPanCard"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileSelect("parentPanCard", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      PDF, JPG, PNG
                    </span>
                  </div>
                )}
              </div>

              {/* 5. Birth Certificate */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.birthCertificate ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.birthCertificate ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.birthCertificate ? "solid" : "dashed",
                }}
              >
                {attachedFiles.birthCertificate ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.birthCertificate.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.birthCertificate.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("birthCertificate")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Birth Certificate
                      <input
                        type="file"
                        name="birthCertificate"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileSelect("birthCertificate", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      PDF, JPG, PNG
                    </span>
                  </div>
                )}
              </div>

              {/* 6. Aadhar Card */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.aadharCard ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.aadharCard ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.aadharCard ? "solid" : "dashed",
                }}
              >
                {attachedFiles.aadharCard ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.aadharCard.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.aadharCard.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("aadharCard")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Aadhaar Card
                      <input
                        type="file"
                        name="aadharCard"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileSelect("aadharCard", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      PDF, JPG, PNG
                    </span>
                  </div>
                )}
              </div>

              {/* 7. Transfer Certificate (T.C.) */}
              <div
                className="border-2 rounded-2xl p-4 text-center relative transition-all"
                style={{
                  backgroundColor: attachedFiles.transferCertificate ? "#ecfdf5" : "#f8fafc",
                  borderColor: attachedFiles.transferCertificate ? "#10b981" : "#cbd5e1",
                  borderStyle: attachedFiles.transferCertificate ? "solid" : "dashed",
                }}
              >
                {attachedFiles.transferCertificate ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Attached
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 truncate max-w-[160px]">
                      {attachedFiles.transferCertificate.name}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {attachedFiles.transferCertificate.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("transferCertificate")}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-7 h-7 mx-auto mb-2" style={{ color: "#64748b" }} />
                    <label className="block text-xs font-bold cursor-pointer" style={{ color: "#0f2e60" }}>
                      Transfer Certificate (TC)
                      <input
                        type="file"
                        name="transferCertificate"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileSelect("transferCertificate", e)}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] block mt-1" style={{ color: "#94a3b8" }}>
                      PDF, JPG, PNG
                    </span>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Action Buttons */}
          <div
            className="flex items-center justify-end gap-4 pt-6 border-t"
            style={{ borderColor: "#f1f5f9" }}
          >
            <button
              type="button"
              onClick={() => {
                reset();
                setAttachedFiles({
                  photo: null,
                  fatherPhoto: null,
                  motherPhoto: null,
                  parentPanCard: null,
                  birthCertificate: null,
                  aadharCard: null,
                  transferCertificate: null,
                });
              }}
              className="px-5 py-2.5 text-xs font-bold rounded-xl border transition-colors hover:bg-slate-50 cursor-pointer"
              style={{ borderColor: "#cbd5e1", color: "#475569" }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#991b1b", color: "#ffffff" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Scholar & Uploading Files...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Generate Scholar Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Hidden Printable Area */}
        <div className="hidden">
          <div ref={printRef}>
            <BlankAdmissionForm />
          </div>
        </div>

      </div>
    </div>
  );
}
