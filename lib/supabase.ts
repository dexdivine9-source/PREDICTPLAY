import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://edgzrlijalsijhsaivej.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ3pybGlqYWxzaWpoc2FpdmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NzM5NzIsImV4cCI6MjEwMzM0OTk3Mn0.JhboCUmQL7ETsd1H7hNf_U1feaQjJ-KfSxVmTmNQBe4";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
