"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email });
    } catch {
      // Backend always returns a generic 200 response - this catch only
      // guards against network failures, and we still show the same
      // generic confirmation so nothing about account state leaks.
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-white px-5 py-8 dark:bg-[#0B0F17]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative h-14 w-14">
            <Image src="/images/atu-logo.jpg" alt="Abaarso Tech University official seal" fill className="object-contain" priority />
          </div>
          <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#90274F] dark:text-[#F7D9E4]">Abaarso Tech University</p>
        </div>

        <h1 className="text-xl font-black text-[#0F172A] sm:text-2xl dark:text-[#F8FAFC]">Reset your password</h1>
        <p className="mt-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">Enter your email address to receive a verification code.</p>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-4 text-sm text-[#0F172A] dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F1F5F9]">
            If this account is eligible, a verification code has been sent.
            <div className="mt-3">
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="text-sm font-bold text-[#90274F] hover:underline dark:text-[#F7D9E4]">
                Continue to verification
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="email">
              Email address
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
                <input
                  id="email"
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  aria-label="Email address"
                  required
                />
              </span>
            </label>

            <Button className="h-11 w-full rounded-xl" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Code"}
            </Button>
          </form>
        )}

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#90274F] dark:text-[#94A3B8] dark:hover:text-[#F7D9E4]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}

