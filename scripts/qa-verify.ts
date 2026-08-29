import prisma from "../src/lib/prisma";
import { issueTransferCertificate, updateTCReceiverDetails, updateStudentGeneralRemark } from "../src/actions/tcActions";
import { upsertStudentFeeProfile, recordFeePayment, getStudentFeeOverview, computeLateFineForMonth } from "../src/actions/feeActions";

async function runQA() {
  console.log("==================================================");
  console.log("STARTING FINAL QA AUTOMATED VERIFICATION SUITE");
  console.log("==================================================");

  // 1. Setup a clean dummy student for testing
  const dummySr = "SR-QA-TEST-001";
  
  // Clean up any prior test student with this SR
  await prisma.student.deleteMany({ where: { srNumber: dummySr } });

  const student = await prisma.student.create({
    data: {
      srNumber: dummySr,
      firstName: "AARAV",
      lastName: "SHARMA",
      dateOfBirth: new Date("2015-05-15"),
      gender: "MALE",
      recordStatus: "ACTIVE",
      parents: {
        create: [
          {
            relationType: "Father",
            firstName: "RAJESH",
            lastName: "SHARMA",
            phoneNumber: "9876543210",
          }
        ]
      },
      academicSessions: {
        create: [
          {
            sessionYear: "2026-2027",
            className: "CLASS V",
          }
        ]
      }
    }
  });
  console.log("✓ Step 0: Test Student Created:", dummySr, `${student.firstName} ${student.lastName}`);

  // ---------------------------------------------------------
  // TEST 1: Global Remark Section
  // ---------------------------------------------------------
  console.log("\n--- TEST 1: Global Student Remark ---");
  const testRemark = "Exemplary conduct in science and mathematics. Eligible for merit badge.";
  const remarkRes = await updateStudentGeneralRemark(dummySr, testRemark);
  if (!remarkRes.success) throw new Error("Failed to update general remark: " + remarkRes.error);
  
  const updatedStudent = await prisma.student.findUnique({ where: { srNumber: dummySr } });
  if (updatedStudent?.generalRemark !== testRemark) {
    throw new Error(`Remark mismatch! Expected "${testRemark}", got "${updatedStudent?.generalRemark}"`);
  }
  console.log("✓ Global Remark saved and verified in DB:", updatedStudent.generalRemark);

  // ---------------------------------------------------------
  // TEST 2: TC Folder & Receiver Acknowledgement
  // ---------------------------------------------------------
  console.log("\n--- TEST 2: Transfer Certificate & Receiver Workflow ---");
  const tcRes = await issueTransferCertificate({
    studentSrNumber: dummySr,
    leavingClass: "CLASS V",
    leavingDate: new Date().toISOString(),
    issuedBy: "Principal Dr. V. K. Rao",
    reasonForLeaving: "Passed Higher Secondary / Matriculation",
    conduct: "Excellent",
    remarks: "Top performer in primary wing",
  });
  if (!tcRes.success || !tcRes.tcRecord) throw new Error("Failed to issue TC: " + tcRes.error);
  console.log("✓ TC Issued Successfully:", tcRes.tcRecord.tcNumber, "Trace:", tcRes.tcRecord.traceCode);

  const receiverRes = await updateTCReceiverDetails({
    tcId: tcRes.tcRecord.id,
    receivedByName: "Rajesh Sharma",
    receivedByRelation: "Father",
    receivedDate: new Date().toISOString(),
    receiptSignatureStatus: "SIGNED",
  });
  if (!receiverRes.success || !receiverRes.tcRecord) throw new Error("Failed to update receiver: " + receiverRes.error);
  if (receiverRes.tcRecord.receiptSignatureStatus !== "SIGNED" || receiverRes.tcRecord.receivedByName !== "Rajesh Sharma") {
    throw new Error("TC receiver details verification failed");
  }
  console.log("✓ TC Receiver Acknowledgement Verified. Status:", receiverRes.tcRecord.receiptSignatureStatus, "by", receiverRes.tcRecord.receivedByName);

  // ---------------------------------------------------------
  // TEST 3: Monthly Fees, Offline Late Fee Engine & Receipts
  // ---------------------------------------------------------
  console.log("\n--- TEST 3: Monthly Fees, Concessions, Offline Late Fee & Receipts ---");
  
  // 3a. Create Fee Profile with Sibling Concession (20% off Rs 2500 -> Rs 2000)
  const profileRes = await upsertStudentFeeProfile({
    studentSrNumber: dummySr,
    sessionYear: "2026-2027",
    className: "CLASS V",
    baseMonthlyFee: 2500,
    hasConcession: true,
    concessionType: "SIBLING",
    concessionPercentage: 20,
    concessionReason: "Younger sibling studying in Class II",
    feeRemarks: "Monthly standing fee commitment",
  });
  if (!profileRes.success || !profileRes.profile) throw new Error("Failed to upsert fee profile: " + profileRes.error);
  if (profileRes.profile.netMonthlyFee !== 2000) {
    throw new Error(`Net fee calculation failed. Expected 2000, got ${profileRes.profile.netMonthlyFee}`);
  }
  console.log("✓ Fee Profile created with 20% concession. Base: ₹2500 -> Net: ₹2000");

  // 3b. Test Offline Late Fee Engine (dynamic query-time calculation without cron)
  const overdueMonthTest = await computeLateFineForMonth("January 2026", 100, false);
  if (!overdueMonthTest.isOverdue || overdueMonthTest.fineAmount <= 0) {
    throw new Error("Offline late fee calculation engine failed to identify overdue month");
  }
  console.log("✓ Offline Late Fee Engine verified: 'January 2026' triggers ₹100/mo overdue fine -> Calculated Fine: ₹" + overdueMonthTest.fineAmount);

  // 3c. Record Fee Payment with Late Fee
  const paymentRes = await recordFeePayment({
    studentSrNumber: dummySr,
    feeProfileId: profileRes.profile.id,
    sessionYear: "2026-2027",
    className: "CLASS V",
    monthCovered: "January 2026",
    installmentNumber: 1,
    installmentPaid: 2000,
    lateFeeFine: 100,
    modeOfPayment: "UPI",
    transactionReference: "UPI-UTR-9928172635",
    paymentReceivedBy: "S. K. Verma (Cashier)",
    dueDate: new Date("2026-01-10").toISOString(),
    remarks: "January Tuition + Late Fine Received",
  });
  if (!paymentRes.success || !paymentRes.payment) throw new Error("Failed to record fee payment: " + paymentRes.error);
  if (paymentRes.payment.totalPaid !== 2100) {
    throw new Error(`Total payment sum mismatch. Expected 2100, got ${paymentRes.payment.totalPaid}`);
  }
  console.log("✓ Fee Payment recorded with Receipt:", paymentRes.payment.receiptNumber, "Total Paid: ₹" + paymentRes.payment.totalPaid);

  // 3d. Verify Overview and Query-Time State
  const overview = await getStudentFeeOverview(dummySr);
  if (!overview.success || !overview.profile) throw new Error("Failed to get fee overview: " + overview.error);
  if (overview.profile.totalPaid !== 2100) {
    throw new Error(`Overview total paid mismatch. Expected 2100, got ${overview.profile.totalPaid}`);
  }
  console.log("✓ Fee Overview verified: Total Collected for Student =", "₹" + overview.profile.totalPaid);

  console.log("\n==================================================");
  console.log("ALL QA VERIFICATION CHECKS PASSED PERFECTLY (100%)");
  console.log("==================================================");
}

runQA()
  .catch((err) => {
    console.error("QA FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
