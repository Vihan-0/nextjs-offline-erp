"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signSessionToken, verifySessionToken } from "@/lib/encryption";
import fs from "fs/promises";
import path from "path";

const COOKIE_NAME = "director_session";
// 8-hour session lifetime in seconds
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * Resolves the configured Director Master Key / PIN from environment.
 * Provides a secure fallback for local development.
 */
function getDirectorMasterKey(): string {
  return process.env.DIRECTOR_MASTER_KEY || "987654";
}

export type AuthActionResult = {
  success: boolean;
  error?: string;
  redirectUrl?: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Disk-backed lockout state — survives server restarts
const LOCKOUT_FILE = path.join(process.cwd(), "storage", "lockout.json");

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

async function readLockoutState(): Promise<LockoutState> {
  try {
    const raw = await fs.readFile(LOCKOUT_FILE, "utf8");
    const parsed = JSON.parse(raw) as LockoutState;
    return {
      failedAttempts: parsed.failedAttempts ?? 0,
      lockedUntil: parsed.lockedUntil ?? null,
      lastAttemptAt: parsed.lastAttemptAt ?? 0,
    };
  } catch {
    // File doesn't exist yet or is corrupt — start fresh
    return { failedAttempts: 0, lockedUntil: null, lastAttemptAt: 0 };
  }
}

async function writeLockoutState(state: LockoutState): Promise<void> {
  try {
    const storageDir = path.join(process.cwd(), "storage");
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(LOCKOUT_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist lockout state:", err);
  }
}

/**
 * Validates the entered Director Master Key / PIN and sets
 * a signed httpOnly session cookie on success.
 * Enforces 5-attempt threshold and a 15-minute security lockout.
 */
export async function loginDirector(input: string | FormData): Promise<AuthActionResult> {
  try {
    const now = Date.now();

    // 1. Read persisted lockout state from disk
    const lockout = await readLockoutState();

    // Check if login is currently locked out
    if (lockout.lockedUntil && now < lockout.lockedUntil) {
      const remainingMinutes = Math.ceil((lockout.lockedUntil - now) / (60 * 1000));
      return {
        success: false,
        error: `SECURITY LOCKOUT: Too many consecutive failed attempts. Director login is locked for ${remainingMinutes} more minute(s). Please try again later.`,
      };
    }

    // If previous lockout has expired, reset attempt count
    if (lockout.lockedUntil && now >= lockout.lockedUntil) {
      lockout.failedAttempts = 0;
      lockout.lockedUntil = null;
      await writeLockoutState(lockout);
    }

    let pin = "";
    if (typeof input === "string") {
      pin = input.trim();
    } else if (input instanceof FormData) {
      pin = (input.get("pin") as string || "").trim();
    }

    if (!pin) {
      return {
        success: false,
        error: "Master Access PIN is required.",
      };
    }

    const masterKey = getDirectorMasterKey().trim();

    // 2. Validate PIN
    if (pin !== masterKey) {
      lockout.failedAttempts += 1;
      lockout.lastAttemptAt = now;

      if (lockout.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockout.lockedUntil = now + LOCKOUT_DURATION_MS;
        await writeLockoutState(lockout);
        return {
          success: false,
          error: "SECURITY LOCKOUT: 5 consecutive failed login attempts detected. Access has been locked for 15 minutes.",
        };
      }

      await writeLockoutState(lockout);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - lockout.failedAttempts;
      return {
        success: false,
        error: `Invalid Director Master PIN. Access Denied. (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before 15-minute security lockout).`,
      };
    }

    // 3. Successful login: reset rate limiter on disk
    await writeLockoutState({ failedAttempts: 0, lockedUntil: null, lastAttemptAt: now });

    // Generate payload: director:<timestamp>
    const payload = `director:${Date.now()}`;
    const signedToken = signSessionToken(payload);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    revalidatePath("/director-dashboard");
    revalidatePath("/login");

    return {
      success: true,
      redirectUrl: "/director-dashboard",
    };
  } catch (error: unknown) {
    console.error("Director login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed.",
    };
  }
}

/**
 * Clears the Director session cookie and revokes executive clearance.
 */
export async function logoutDirector(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    revalidatePath("/director-dashboard");
    revalidatePath("/login");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Director logout error:", error);
    return { success: false };
  }
}

/**
 * Server-side check to verify if the current caller has an active, valid Director session.
 */
export async function verifyDirectorSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return false;
    }

    const result = verifySessionToken(sessionCookie.value, SESSION_MAX_AGE_SECONDS * 1000);
    return result.valid;
  } catch (err) {
    console.error("Error verifying director session:", err);
    return false;
  }
}
