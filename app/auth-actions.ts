"use server";

/*
 * =========================================================================
 * RETIRED EMAIL-CODE (OTP) AUTH ACTIONS
 * Kept commented out for reference in case email-code flow is revisited.
 * Active auth flow is Firebase Client Google Sign-In in AuthModal.tsx.
 * =========================================================================
 *
 * import { randomInt, createHash } from "node:crypto";
 * import { adminAuth, adminDb } from "@/lib/firebase-admin";
 * import { FieldValue } from "firebase-admin/firestore";
 *
 * const STUB_EMAIL_DELIVERY = true;
 * const CODE_TTL_MS = 10 * 60 * 1000;
 * const MAX_ATTEMPTS = 5;
 *
 * function normalizeEmail(raw: string) { return raw.trim().toLowerCase(); }
 * function isValidEmail(email: string) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }
 * function hashCode(email: string, code: string) { return createHash("sha256").update(`${email}:${code}`).digest("hex"); }
 *
 * export async function sendCodeAction(rawEmail: string) { ... }
 * export async function verifyCodeAction(rawEmail: string, rawCode: string) { ... }
 */

export async function pingAuthAction() {
  return { ok: true };
}

