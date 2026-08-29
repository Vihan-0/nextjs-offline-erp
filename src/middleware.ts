import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "director_session";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

async function getHmacCryptoKey(): Promise<CryptoKey> {
  const envKey = process.env.ENCRYPTION_KEY;
  let keyBytes: Uint8Array;

  if (!envKey) {
    const saltBytes = new TextEncoder().encode("townhall-development-secure-encryption-key-salt");
    const hash = await crypto.subtle.digest("SHA-256", saltBytes);
    keyBytes = new Uint8Array(hash);
  } else if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    keyBytes = new Uint8Array(envKey.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  } else {
    keyBytes = new TextEncoder().encode(envKey);
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function isValidDirectorToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  try {
    const [payloadBase64, signatureHex] = parts;
    if (!payloadBase64 || !signatureHex || signatureHex.length !== 64) {
      return false;
    }

    const key = await getHmacCryptoKey();
    const dataBytes = new TextEncoder().encode(payloadBase64);
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );

    const isSigValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      dataBytes as BufferSource
    );

    if (!isSigValid) {
      return false;
    }

    // Base64Url decode payload
    let base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const decodedStr = atob(base64);
    const [role, timestampStr] = decodedStr.split(":");

    if (role !== "director" || !timestampStr) {
      return false;
    }

    const issuedAt = parseInt(timestampStr, 10);
    if (isNaN(issuedAt)) {
      return false;
    }

    const now = Date.now();
    if (now - issuedAt > SESSION_MAX_AGE_MS || issuedAt > now + 60000) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Middleware session verification error:", err);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /director-dashboard and all nested routes
  if (pathname.startsWith("/director-dashboard")) {
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    const token = sessionCookie?.value;

    const valid = await isValidDirectorToken(token);
    if (!valid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/director-dashboard/:path*",
    "/director-dashboard",
  ],
};
