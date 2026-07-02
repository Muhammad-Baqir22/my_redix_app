"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch {
      toast.error("Could not send reset email. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0b0e1a" }}>
      <Toaster position="top-center" />
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div className="rounded-2xl border border-white/[0.07] p-8" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
            <Mail size={20} className="text-white" />
          </div>

          <h1 className="text-white font-bold text-xl mb-1">Reset your password</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter your email and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium text-sm mb-1">Email sent!</p>
              <p className="text-gray-500 text-sm">Check your inbox and follow the link to reset your password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
