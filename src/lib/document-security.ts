import crypto from "crypto";
import QRCode from "qrcode";

export type DocumentType = 
  | "TRANSFER_CERTIFICATE"
  | "REPORT_CARD_PRE_PRIMARY"
  | "REPORT_CARD_LOWER_PRIMARY"
  | "REPORT_CARD_MID_LEVELS"
  | "REPORT_CARD_CLASS_IX"
  | "SR_FRONT_PAGE"
  | "SR_BACK_PAGE"
  | "STUDENT_ID_CARD";

export interface DocumentPayload {
  documentType: DocumentType;
  srNumber: string;
  studentName: string;
  dateOfBirth?: string | null;
  className?: string | null;
  sessionYear?: string | null;
  grandTotal?: number | string | null;
  percentage?: number | string | null;
  resultStatus?: string | null;
  issuedAt?: string | null;
  marksHash?: string | null;
  extraDetails?: Record<string, unknown>;
}

/**
 * Computes a deterministic, cryptographic anti-tamper trace code for any academic document.
 * If any mark or demographic value changes, the generated trace code changes completely.
 */
export function generateDeterministicTraceCode(
  payload: DocumentPayload,
  prefix: string = "SEC"
): string {
  const secretKey = process.env.ENCRYPTION_KEY || "townhall-anti-tamper-secret-key-2026";
  
  // Canonicalize the document attributes
  const canonicalPayload = [
    payload.documentType,
    payload.srNumber.trim().toUpperCase(),
    payload.studentName.trim().toUpperCase(),
    payload.dateOfBirth || "",
    payload.className || "",
    payload.sessionYear || "",
    String(payload.grandTotal ?? ""),
    String(payload.percentage ?? ""),
    payload.resultStatus || "",
    payload.marksHash || "",
  ].join("|");

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(canonicalPayload);
  const digest = hmac.digest("hex").toUpperCase();
  const hex8 = digest.substring(0, 8);

  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().substring(0, 4) || "SEC";
  return `${cleanPrefix}-${hex8}`;
}

/**
 * Generates a high-contrast, print-optimized QR Code data URL pointing to the public verification portal.
 */
export async function generateVerificationQRDataUrl(
  traceCode: string,
  customOrigin?: string
): Promise<string> {
  const baseUrl = 
    customOrigin || 
    process.env.NEXT_PUBLIC_APP_URL || 
    "http://localhost:3000";
  
  const verificationUrl = `${baseUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(traceCode.trim())}`;

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Error generating QR code:", err);
    return "";
  }
}
