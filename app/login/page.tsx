"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full p-8 border border-pp-border rounded-xl bg-pp-secondary/10 backdrop-blur-sm">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        {error && <div className="p-4 mb-4 text-red-400 bg-red-400/10 rounded-lg">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-pp-secondary/50 border border-pp-border rounded-lg p-3 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-pp-secondary/50 border border-pp-border rounded-lg p-3 text-white" />
          </div>
          <button type="submit" className="w-full bg-pp-primary text-black font-bold py-3 rounded-lg hover:bg-pp-primary-dark transition-colors">
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/register" className="text-pp-primary hover:underline">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}
