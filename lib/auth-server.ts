import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized: Invalid or missing auth session");
  }
  
  return {
    ...user,
    uid: user.id,
    admin: user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin",
  };
}
