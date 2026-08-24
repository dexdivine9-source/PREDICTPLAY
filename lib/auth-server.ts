import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthorized: Missing auth token");
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken; // contains uid and claims
  } catch (error) {
    throw new Error("Unauthorized: Invalid or expired token");
  }
}
