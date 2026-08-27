import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      const userId = session.user.id;
      const now = new Date().toISOString();

      // Ensure wallet exists with 1000 signup bonus
      const { data: existingWallet } = await supabase
        .from("virtual_wallets")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingWallet) {
        await supabase.from("virtual_wallets").insert({
          user_id: userId,
          balance: 1000,
          created_at: now,
          updated_at: now,
        });

        try {
          await supabase.from("transactions").insert({
            user_id: userId,
            amount: 1000,
            type: "SIGNUP_BONUS",
            reference_id: userId,
            created_at: now,
          });
        } catch {
          // non-fatal
        }
      }

      // Check if user already has a player profile
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        return NextResponse.redirect(`${origin}/`);
      } else {
        return NextResponse.redirect(`${origin}/profile/create`);
      }
    }
  }

  // Return the user to home page if code exchange fails
  return NextResponse.redirect(`${origin}/`);
}
