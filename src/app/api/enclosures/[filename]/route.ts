import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // 1. Resolve and sanitize target filename (prevent directory traversal)
    const { filename } = await context.params;
    if (!filename) {
      return NextResponse.json({ error: "Filename parameter is required." }, { status: 400 });
    }

    const decodedFilename = decodeURIComponent(filename);
    const cleanFilename = path.basename(decodedFilename);

    if (cleanFilename.includes("..") || cleanFilename.includes("/") || cleanFilename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename path." }, { status: 400 });
    }

    // 2. Check in private storage/enclosures directory first
    const primaryStorageDir = path.join(process.cwd(), "storage", "enclosures");
    const primaryFilePath = path.join(primaryStorageDir, cleanFilename);

    let finalFilePath = primaryFilePath;
    let fileFound = false;

    try {
      await fs.access(primaryFilePath);
      fileFound = true;
    } catch {
      // Fallback check in legacy public/uploads directory
      const legacyStorageDir = path.join(process.cwd(), "public", "uploads");
      const legacyFilePath = path.join(legacyStorageDir, cleanFilename);

      try {
        await fs.access(legacyFilePath);
        finalFilePath = legacyFilePath;
        fileFound = true;
      } catch {
        fileFound = false;
      }
    }

    if (!fileFound) {
      return NextResponse.json(
        { error: `Requested enclosure "${cleanFilename}" was not found.` },
        { status: 404 }
      );
    }

    // 3. Determine content type and read file
    const ext = path.extname(cleanFilename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await fs.readFile(finalFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("Error streaming enclosure:", error);
    return NextResponse.json(
      { error: "Internal server error reading enclosure." },
      { status: 500 }
    );
  }
}
