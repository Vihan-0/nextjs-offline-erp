import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalNavbar } from "@/components/navigation/GlobalNavbar";
import prisma from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Town Hall Public High School | Enterprise Record & Governance",
  description: "Official Scholar Register, Transfer Certificate, and Tiered Progress Report Card Governance Suite.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingApprovals = await prisma.student.count({
    where: { recordStatus: { in: ["PENDING", "PENDING_DELETION"] } },
  }).catch(() => 0);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100">
        <GlobalNavbar pendingApprovals={pendingApprovals} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
