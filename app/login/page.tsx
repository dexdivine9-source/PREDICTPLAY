"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <AuthModal isOpen={true} onClose={() => router.push("/")} />
    </div>
  );
}

