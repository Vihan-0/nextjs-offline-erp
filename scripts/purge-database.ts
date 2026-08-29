import prisma from "../src/lib/prisma";
import fs from "fs/promises";
import path from "path";

async function purgeDatabase() {
  console.log("==================================================");
  console.log("STARTING FULL DATABASE & ENCLOSURES PURGE");
  console.log("RESETTING SYSTEM TO ZERO FOR CLIENT DEPLOYMENT");
  console.log("==================================================");

  // 1. Delete in child-to-parent order to respect foreign keys (or via transaction)
  await prisma.$transaction([
    prisma.feePayment.deleteMany({}),
    prisma.studentFeeProfile.deleteMany({}),
    prisma.transferCertificateRecord.deleteMany({}),
    prisma.printAudit.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.softSkill.deleteMany({}),
    prisma.mark.deleteMany({}),
    prisma.academicSession.deleteMany({}),
    prisma.parent.deleteMany({}),
    prisma.student.deleteMany({}),
  ]);

  console.log("✓ All database rows successfully deleted.");

  // 2. Clear dummy files inside storage/enclosures/
  const enclosuresDir = path.join(process.cwd(), "storage", "enclosures");
  try {
    const files = await fs.readdir(enclosuresDir);
    for (const file of files) {
      const filePath = path.join(enclosuresDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        await fs.unlink(filePath);
        console.log(`✓ Deleted storage file: ${file}`);
      }
    }
    console.log("✓ Storage enclosures folder completely purged.");
  } catch (err) {
    console.log("Storage enclosures directory check/clear:", err);
  }

  // 3. Verification of Zero State
  console.log("\n--- VERIFYING ZERO STATE ACROSS ALL TABLES ---");
  const [
    studentCount,
    parentCount,
    sessionCount,
    markCount,
    softSkillCount,
    auditCount,
    printAuditCount,
    tcCount,
    feeProfileCount,
    feePaymentCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.parent.count(),
    prisma.academicSession.count(),
    prisma.mark.count(),
    prisma.softSkill.count(),
    prisma.auditLog.count(),
    prisma.printAudit.count(),
    prisma.transferCertificateRecord.count(),
    prisma.studentFeeProfile.count(),
    prisma.feePayment.count(),
  ]);

  console.log(`Students:                     ${studentCount}`);
  console.log(`Parents:                      ${parentCount}`);
  console.log(`Academic Sessions:            ${sessionCount}`);
  console.log(`Marks:                        ${markCount}`);
  console.log(`Soft Skills:                  ${softSkillCount}`);
  console.log(`Audit Logs:                   ${auditCount}`);
  console.log(`Print Audits:                 ${printAuditCount}`);
  console.log(`TC Records:                   ${tcCount}`);
  console.log(`Student Fee Profiles:         ${feeProfileCount}`);
  console.log(`Fee Payments:                 ${feePaymentCount}`);

  const totalRecords =
    studentCount +
    parentCount +
    sessionCount +
    markCount +
    softSkillCount +
    auditCount +
    printAuditCount +
    tcCount +
    feeProfileCount +
    feePaymentCount;

  if (totalRecords !== 0) {
    throw new Error(`Purge incomplete! Remaining records found: ${totalRecords}`);
  }

  console.log("\n==================================================");
  console.log("DATABASE & STORAGE FULLY PURGED: CLEAN BLANK SLATE");
  console.log("==================================================");
}

purgeDatabase()
  .catch((err) => {
    console.error("PURGE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
