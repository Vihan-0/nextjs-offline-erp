"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Calendar,
  Phone,
  MapPin,
  Heart,
  FileText,
  CreditCard,
  Upload,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building,
  Sparkles,
} from "lucide-react";
import { updateStudentAction } from "@/actions/student";

export interface StudentEditData {
  srNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | Date | null;
  gender?: string;
  bloodGroup?: string | null;
  distanceFromSchool?: number | null;
  religion?: string | null;
  category?: string | null;
  nationality?: string | null;
  medicalConditions?: string | null;
  allergies?: string | null;
  className?: string;
  sessionYear?: string;
  fatherName?: string;
  fatherPhone?: string | null;
  fatherOccupation?: string | null;
  fatherEducation?: string | null;
  fatherIncome?: number | null;
  motherName?: string;
  motherPhone?: string | null;
  motherOccupation?: string | null;
  motherEducation?: string | null;
  motherIncome?: number | null;
  address?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  aadharNumber?: string | null;
  apaarId?: string | null;
  photoPath?: string | null;
}

interface EditStudentModalProps {
  student: StudentEditData;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStudentModal({ student, isOpen, onClose }: EditStudentModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"demographics" | "parents" | "academic" | "documents">("demographics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Form State
  const [firstName, setFirstName] = useState(student.firstName || "");
  const [lastName, setLastName] = useState(student.lastName || "");
  const [dateOfBirth, setDateOfBirth] = useState<string>(() => {
    if (!student.dateOfBirth) return "";
    const d = new Date(student.dateOfBirth);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  });
  const [gender, setGender] = useState(student.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState(student.bloodGroup || "");
  const [distanceFromSchool, setDistanceFromSchool] = useState(
    student.distanceFromSchool ? String(student.distanceFromSchool) : ""
  );
  const [religion, setReligion] = useState(student.religion || "");
  const [category, setCategory] = useState(student.category || "General");
  const [nationality, setNationality] = useState(student.nationality || "Indian");
  const [medicalConditions, setMedicalConditions] = useState(student.medicalConditions || "");
  const [allergies, setAllergies] = useState(student.allergies || "");

  // Academic
  const [className, setClassName] = useState(student.className || "CLASS I");
  const [sessionYear, setSessionYear] = useState(student.sessionYear || "2026-2027");

  // Parents
  const [fatherName, setFatherName] = useState(student.fatherName || "");
  const [fatherPhone, setFatherPhone] = useState(student.fatherPhone || "");
  const [fatherOccupation, setFatherOccupation] = useState(student.fatherOccupation || "");
  const [fatherEducation, setFatherEducation] = useState(student.fatherEducation || "");
  const [fatherIncome, setFatherIncome] = useState(
    student.fatherIncome ? String(student.fatherIncome) : ""
  );

  const [motherName, setMotherName] = useState(student.motherName || "");
  const [motherPhone, setMotherPhone] = useState(student.motherPhone || "");
  const [motherOccupation, setMotherOccupation] = useState(student.motherOccupation || "");
  const [motherEducation, setMotherEducation] = useState(student.motherEducation || "");
  const [motherIncome, setMotherIncome] = useState(
    student.motherIncome ? String(student.motherIncome) : ""
  );

  const [address, setAddress] = useState(student.address || "");
  const [currentAddress, setCurrentAddress] = useState(student.currentAddress || "");
  const [permanentAddress, setPermanentAddress] = useState(student.permanentAddress || "");
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [aadharNumber, setAadharNumber] = useState(student.aadharNumber || "");
  const [apaarId, setApaarId] = useState(student.apaarId || "");

  // Sync addresses if checked
  React.useEffect(() => {
    if (isSameAddress) {
      setPermanentAddress(currentAddress);
      setAddress(currentAddress);
    }
  }, [isSameAddress, currentAddress]);

  // Files
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [tcFile, setTcFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [fatherPhotoFile, setFatherPhotoFile] = useState<File | null>(null);
  const [motherPhotoFile, setMotherPhotoFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("srNumber", student.srNumber);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
      formData.append("gender", gender);
      formData.append("bloodGroup", bloodGroup);
      formData.append("distanceFromSchool", distanceFromSchool);
      formData.append("religion", religion);
      formData.append("category", category);
      formData.append("nationality", nationality);
      formData.append("medicalConditions", medicalConditions);
      formData.append("allergies", allergies);

      formData.append("className", className);
      formData.append("sessionYear", sessionYear);

      formData.append("fatherName", fatherName);
      formData.append("fatherPhone", fatherPhone);
      formData.append("fatherOccupation", fatherOccupation);
      formData.append("fatherEducation", fatherEducation);
      formData.append("fatherIncome", fatherIncome);

      formData.append("motherName", motherName);
      formData.append("motherPhone", motherPhone);
      formData.append("motherOccupation", motherOccupation);
      formData.append("motherEducation", motherEducation);
      if (motherIncome) formData.append("motherIncome", motherIncome);

      formData.append("address", address);
      formData.append("currentAddress", currentAddress);
      formData.append("permanentAddress", permanentAddress);
      formData.append("aadharNumber", aadharNumber);
      formData.append("apaarId", apaarId);

      if (photoFile) formData.append("photo", photoFile);
      if (birthCertFile) formData.append("birthCertificate", birthCertFile);
      if (aadharFile) formData.append("aadharCard", aadharFile);
      if (tcFile) formData.append("transferCertificate", tcFile);
      if (panFile) formData.append("parentPanCard", panFile);
      if (fatherPhotoFile) formData.append("fatherPhoto", fatherPhotoFile);
      if (motherPhotoFile) formData.append("motherPhoto", motherPhotoFile);

      const res = await updateStudentAction(formData);

      if (res.success) {
        setStatus({ success: true, message: res.message as string });
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1500);
      } else {
        setStatus({ success: false, message: res.error || "Failed to update record." });
      }
    } catch (err: unknown) {
      setStatus({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100 font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Edit Scholar Profile & Details</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                  {student.srNumber}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Correct misspelled names, demographics, parent info, and document enclosures. Maker-Checker verified.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("demographics")}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === "demographics"
                ? "bg-zinc-800 text-amber-300 border-t-2 border-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            1. Scholar Demographics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("parents")}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === "parents"
                ? "bg-zinc-800 text-amber-300 border-t-2 border-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            2. Parents & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("academic")}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === "academic"
                ? "bg-zinc-800 text-amber-300 border-t-2 border-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            3. Class & Health
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === "documents"
                ? "bg-zinc-800 text-amber-300 border-t-2 border-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            4. Enclosures & Photos
          </button>
        </div>

        {/* Feedback Alert */}
        {status && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              status.success
                ? "bg-emerald-950/80 text-emerald-200 border-emerald-800"
                : "bg-rose-950/80 text-rose-200 border-rose-800"
            }`}
          >
            {status.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: Demographics */}
          {activeTab === "demographics" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. AARAV"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. SHARMA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Religion
                  </label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Hindu, Muslim, Sikh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="Indian"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    APAAR / PEN ID
                  </label>
                  <input
                    type="text"
                    value={apaarId}
                    onChange={(e) => setApaarId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="12-digit APAAR/PEN"
                    maxLength={12}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Parents */}
          {activeTab === "parents" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Father / Primary Guardian
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. RAJESH SHARMA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={fatherPhone}
                      onChange={(e) => setFatherPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={fatherOccupation}
                      onChange={(e) => setFatherOccupation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Business / Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Education</label>
                    <input
                      type="text"
                      value={fatherEducation}
                      onChange={(e) => setFatherEducation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Graduate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Annual Income (₹)</label>
                    <input
                      type="number"
                      value={fatherIncome}
                      onChange={(e) => setFatherIncome(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. 600000"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Mother's Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. PRIYA SHARMA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Mother Phone Number</label>
                    <input
                      type="tel"
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Mother Occupation</label>
                    <input
                      type="text"
                      value={motherOccupation}
                      onChange={(e) => setMotherOccupation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Home Maker / Doctor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Mother Education</label>
                    <input
                      type="text"
                      value={motherEducation}
                      onChange={(e) => setMotherEducation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Post Graduate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Annual Income (₹)</label>
                    <input
                      type="number"
                      value={motherIncome}
                      onChange={(e) => setMotherIncome(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. 500000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Current Residential Address</label>
                  <textarea
                    rows={2}
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. 12/45 CHOWK, LUCKNOW"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAddressEdit"
                    checked={isSameAddress}
                    onChange={(e) => setIsSameAddress(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="sameAddressEdit" className="text-xs font-semibold text-zinc-400">
                    Permanent Address is same as Current Address
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    value={isSameAddress ? currentAddress : permanentAddress}
                    onChange={(e) => {
                      setPermanentAddress(e.target.value);
                      setAddress(e.target.value);
                    }}
                    disabled={isSameAddress}
                    className={`w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:ring-1 focus:ring-amber-500 focus:outline-none ${isSameAddress ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="e.g. 12/45 CHOWK, LUCKNOW"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Academic & Health */}
          {activeTab === "academic" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Current Class</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="NURSERY">NURSERY</option>
                    <option value="L.K.G.">L.K.G.</option>
                    <option value="U.K.G.">U.K.G.</option>
                    <option value="CLASS I">CLASS I</option>
                    <option value="CLASS II">CLASS II</option>
                    <option value="CLASS III">CLASS III</option>
                    <option value="CLASS IV">CLASS IV</option>
                    <option value="CLASS V">CLASS V</option>
                    <option value="CLASS VI">CLASS VI</option>
                    <option value="CLASS VII">CLASS VII</option>
                    <option value="CLASS VIII">CLASS VIII</option>
                    <option value="CLASS IX">CLASS IX</option>
                    <option value="CLASS X">CLASS X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Session Year</label>
                  <input
                    type="text"
                    value={sessionYear}
                    onChange={(e) => setSessionYear(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="2026-2027"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Asthma, Glasses, None"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Allergies</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Peanut, Dust, None"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Distance From School (in KM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={distanceFromSchool}
                  onChange={(e) => setDistanceFromSchool(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Enclosures & Photos */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-zinc-400">
                Upload new files to replace existing physical copies. Leave empty to retain current files.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Scholar Photo */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">📸 Student Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>

                {/* 2. Aadhaar Card */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">🆔 Aadhaar Card Copy</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>

                {/* 3. Parent PAN Card */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">💳 Parent PAN Card Copy</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPanFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>

                {/* 4. Birth Certificate */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">📜 Birth Certificate</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBirthCertFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>

                {/* 5. Father's Photo */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">👨 Father's Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFatherPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>

                {/* 6. Mother's Photo */}
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                  <label className="block text-xs font-bold text-zinc-200">👩 Mother's Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMotherPhotoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Maker-Checker Governance Protocol</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 font-sans"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
