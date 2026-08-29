import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ArrowLeft, Printer, ShieldCheck, CheckCircle2, IndianRupee } from "lucide-react";

interface PageProps {
  params: Promise<{
    receiptNumber: string;
  }>;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function FeeReceiptPage({ params }: PageProps) {
  const { receiptNumber } = await params;
  const decodedReceiptNo = decodeURIComponent(receiptNumber).trim();

  const payment = await prisma.feePayment.findUnique({
    where: { receiptNumber: decodedReceiptNo },
    include: {
      feeProfile: {
        include: {
          student: {
            include: {
              parents: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const student = payment.feeProfile.student;
  const father = student.parents.find((p) => p.relationType?.toLowerCase() === "father");
  const mother = student.parents.find((p) => p.relationType?.toLowerCase() === "mother");
  const parentName = father ? `${father.firstName} ${father.lastName}`.trim() : mother ? `${mother.firstName} ${mother.lastName}`.trim() : "—";
  const studentName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 print:bg-white print:text-black">
      {/* Non-printable Action Bar */}
      <div className="no-print border-b border-zinc-800 bg-zinc-900/90 sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/fees"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fees Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
              Receipt: {payment.receiptNumber}
            </span>
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg cursor-pointer"
              id="print-button"
            >
              <Printer className="w-4 h-4" />
              Print Receipt (A5/A4)
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <main className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 p-8 sm:p-10 space-y-6 print:shadow-none print:border print:border-black print:rounded-none print:p-6 print:text-black">
          
          {/* Institutional Header */}
          <div className="text-center border-b-2 border-zinc-900 pb-4 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <img
                src="/thphslogo.jpeg"
                alt="School Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-tight text-zinc-950">
                  Town Hall High School
                </h1>
                <p className="text-[11px] font-medium text-zinc-600">
                  Affiliated to State Board &amp; Secondary Education • Est. 1994
                </p>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-block bg-zinc-900 text-white font-bold text-xs uppercase px-4 py-1 rounded-full print:bg-black print:text-white">
                Official Fee Payment Receipt
              </span>
            </div>
          </div>

          {/* Receipt Meta Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <span className="text-zinc-500 font-semibold w-24">Receipt No:</span>
                <span className="font-mono font-bold text-zinc-900">{payment.receiptNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 font-semibold w-24">Scholar No:</span>
                <span className="font-mono font-bold text-zinc-900">{payment.studentSrNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 font-semibold w-24">Student Name:</span>
                <span className="font-bold text-zinc-900 uppercase">{studentName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 font-semibold w-24">Father&apos;s Name:</span>
                <span className="font-medium text-zinc-900 uppercase">{parentName}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right sm:text-left">
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-zinc-500 font-semibold w-28">Payment Date:</span>
                <span className="font-bold text-zinc-900">{formatDate(payment.paymentDate)}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-zinc-500 font-semibold w-28">Academic Session:</span>
                <span className="font-bold text-zinc-900">{payment.sessionYear}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-zinc-500 font-semibold w-28">Class / Grade:</span>
                <span className="font-bold text-zinc-900">{payment.className}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-zinc-500 font-semibold w-28">Month Covered:</span>
                <span className="font-bold text-emerald-800 print:text-black">{payment.monthCovered}</span>
              </div>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-zinc-300 rounded-xl overflow-hidden print:border-black">
            <table className="w-full text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-300 print:bg-zinc-200 print:border-black">
                <tr>
                  <th className="py-2.5 px-4 text-left font-bold text-zinc-700 uppercase">Description</th>
                  <th className="py-2.5 px-4 text-center font-bold text-zinc-700 uppercase">Installment</th>
                  <th className="py-2.5 px-4 text-right font-bold text-zinc-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 print:divide-black">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-zinc-900">Tuition &amp; Educational Composite Fee</div>
                    <div className="text-[10px] text-zinc-500">Month: {payment.monthCovered}</div>
                    {payment.feeProfile.hasConcession && (
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Concession Applied: {payment.feeProfile.concessionType?.replace("_", " ")}
                        {payment.feeProfile.concessionPercentage ? ` (${payment.feeProfile.concessionPercentage}%)` : ""}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    Installment #{payment.installmentNumber}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                    {formatCurrency(payment.installmentPaid)}
                  </td>
                </tr>

                {payment.lateFeeFine > 0 && (
                  <tr className="bg-red-50/50 print:bg-transparent">
                    <td className="py-2.5 px-4 text-red-900 font-medium">
                      Late Payment Fine (Overdue Charge)
                    </td>
                    <td className="py-2.5 px-4 text-center text-zinc-500">—</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-red-700 print:text-black">
                      {formatCurrency(payment.lateFeeFine)}
                    </td>
                  </tr>
                )}

                <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-900 print:bg-zinc-100 print:border-black">
                  <td className="py-3 px-4 text-zinc-900 uppercase text-xs" colSpan={2}>
                    Total Amount Received
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800 print:text-black font-black">
                    {formatCurrency(payment.totalPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode & Settlement Info */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs space-y-1.5 print:bg-transparent print:border-black">
            <div className="flex justify-between">
              <span className="text-zinc-600">Payment Mode:</span>
              <span className="font-bold uppercase text-zinc-900">{payment.modeOfPayment}</span>
            </div>
            {payment.transactionReference && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Ref / Cheque / UTR:</span>
                <span className="font-mono font-bold text-zinc-900">{payment.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-600">Payment Received By:</span>
              <span className="font-bold text-zinc-900">{payment.paymentReceivedBy}</span>
            </div>
            {payment.remarks && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Notes / Remarks:</span>
                <span className="text-zinc-700 italic">{payment.remarks}</span>
              </div>
            )}
          </div>

          {/* Signatures & Stamp Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-8">
              <div className="h-8"></div>
              <div className="border-t border-zinc-400 pt-1 font-semibold text-zinc-700">
                Depositor / Parent Signature
              </div>
            </div>
            <div className="space-y-8">
              <div className="h-8 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-emerald-700 border border-emerald-600 px-2 py-0.5 rounded uppercase">
                  PAID &amp; VERIFIED
                </span>
              </div>
              <div className="border-t border-zinc-400 pt-1 font-semibold text-zinc-700">
                Cashier / Authorized Signatory
              </div>
            </div>
          </div>

          {/* Verification Trace & Disclaimer */}
          <div className="border-t border-zinc-200 pt-3 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 gap-2">
            <span>This is a computer-generated official receipt from Town Hall ERP.</span>
            <span className="font-mono font-bold">Trace ID: {payment.receiptNumber}</span>
          </div>

        </div>
      </main>

      {/* Print script trigger */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-button')?.addEventListener('click', () => {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
