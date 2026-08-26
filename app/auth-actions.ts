"use server";

import { randomInt, createHash } from "node:crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ─────────────────────────────────────────────────────────────────────────
// EMAIL DELIVERY STUB
// While this is true, sendCodeAction returns the generated code to the client
// so the flow is fully clickable without an email provider. To go live:
//   1. flip STUB_EMAIL_DELIVERY to false
//   2. implement deliverCode() with a real sender (e.g. Resend) and uncomment
//      the call in sendCodeAction
// Nothing else in this file (or the UI) needs to change.
// ─────────────────────────────────────────────────────────────────────────
const STUB_EMAIL_DELIVERY = true;

const CODE_TTL_MS = 10 * 60 * 1000; // codes are valid for 10 minutes
const MAX_ATTEMPTS = 5;

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// We store only a hash of the code, never the code itself.
function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function deliverCode(_email: string, _code: string) {
  // TODO (option A): send the code with a real email provider, e.g.
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from, to: _email, subject: "Your PredictPlay code", html: ... });
}

type SendResult =
  | { success: true; devCode?: string }
  | { success: false; error: string };

export async function sendCodeAction(rawEmail: string): Promise<SendResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  try {
    await adminDb.collection("email_codes").doc(email).set({
      codeHash: hashCode(email, code),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (STUB_EMAIL_DELIVERY) {
      console.log(`[auth stub] verification code for ${email}: ${code}`);
      return { success: true, devCode: code };
    }

    await deliverCode(email, code);
    return { success: true };
  } catch (err: any) {
    console.error("[sendCodeAction error]:", err);
    return { 
      success: false, 
      error: err?.message || "Failed to generate verification code. Please check server configuration." 
    };
  }
}

type VerifyResult =
  | { success: true; token: string; hasProfile: boolean }
  | { success: false; error: string };

export async function verifyCodeAction(
  rawEmail: string,
  rawCode: string
): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim();

  try {
    const ref = adminDb.collection("email_codes").doc(email);
    const snap = await ref.get();
    if (!snap.exists) {
      return { success: false, error: "No code found for this email. Request a new one." };
    }

    const data = snap.data()!;

    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return { success: false, error: "That code has expired. Request a new one." };
    }

    if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
      await ref.delete();
      return { success: false, error: "Too many attempts. Request a new code." };
    }

    if (data.codeHash !== hashCode(email, code)) {
      await ref.update({ attempts: FieldValue.increment(1) });
      return { success: false, error: "Incorrect code. Please try again." };
    }

    // Correct — consume the code so it can't be reused.
    await ref.delete();

    // Find the existing auth user, or create one for a first-time email.
    let uid: string;
    try {
      uid = (await adminAuth.getUserByEmail(email)).uid;
    } catch {
      uid = (await adminAuth.createUser({ email })).uid;
    }

    // "New user" for routing = signed in but hasn't completed a game profile yet.
    const hasProfile = (
      await adminDb.collection("player_profiles").doc(uid).get()
    ).exists;

    // Client exchanges this for a real session via signInWithCustomToken().
    const token = await adminAuth.createCustomToken(uid);

    return { success: true, token, hasProfile };
  } catch (err: any) {
    console.error("[verifyCodeAction error]:", err);
    return {
      success: false,
      error: err?.message || "Failed to verify code. Please try again.",
    };
  }
}
