import { z } from "zod";

import { normalizeSrNumber } from "@/lib/srNumber";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

const fileSchema = z
  .any()
  .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
    "Only .jpg, .jpeg, .png and .pdf formats are supported."
  )
  .optional();

export const admissionSchema = z.object({
  // Student Details
  srNumber: z
    .string()
    .min(1, "Scholar Register Number is required")
    .transform((val) => normalizeSrNumber(val)),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.string().optional(),
  distanceFromSchool: z.string().optional(), // String to handle form input easily, parse later
  religion: z.string().optional(),
  category: z.string().optional(),
  nationality: z.string().optional(),
  className: z.string().optional(),
  sessionYear: z.string().optional(),
  
  // Medical
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),

  // Father Details
  fatherName: z.string().min(1, "Father's name is required"),
  fatherOccupation: z.string().optional(),
  fatherEducation: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherIncome: z.string().optional(),

  // Mother Details
  motherName: z.string().min(1, "Mother's name is required"),
  motherOccupation: z.string().optional(),
  motherEducation: z.string().optional(),
  motherPhone: z.string().optional(),

  // Address & Parent Government Credentials
  address: z.string().min(1, "Residential address is required"),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  parentPan: z.string().optional(),

  // Extended Identifiers
  penNumber: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, "").length === 11,
    "PEN number must be exactly 11 digits"
  ),
  apaarId: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, "").length === 12,
    "APAAR ID must be exactly 12 digits"
  ),
  aadharNumber: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, "").length === 12,
    "Aadhaar number must be exactly 12 digits"
  ),
  fatherAadhar: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, "").length === 12,
    "Father's Aadhaar must be exactly 12 digits"
  ),
  motherAadhar: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, "").length === 12,
    "Mother's Aadhaar must be exactly 12 digits"
  ),
  motherIncome: z.string().optional(),
  admissionDate: z.string().optional(),
  admissionSession: z.string().optional(),
  admissionClass: z.string().optional(),
}).refine(
  (data) => {
    if (!data.dateOfBirth || !data.admissionDate) return true;
    const dob = new Date(data.dateOfBirth);
    const adm = new Date(data.admissionDate);
    if (isNaN(dob.getTime()) || isNaN(adm.getTime())) return true;
    return dob <= adm;
  },
  {
    message: "Date of Birth cannot be after Date of Admission.",
    path: ["dateOfBirth"],
  }
);

export type AdmissionFormValues = z.infer<typeof admissionSchema>;
