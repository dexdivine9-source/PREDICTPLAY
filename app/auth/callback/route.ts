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
