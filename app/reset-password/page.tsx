"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiClient, ApiClientError } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"code" | "password">("code");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !/^\d{6}$/.test(code)) {
      setError("Enter your email and the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{ verified: boolean; resetToken: string }>(
        "/api/auth/verify-reset-code",
        { email, code }
      );
      setResetToken(response.resetToken);
      setStep("password");
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/auth/reset-password", { resetToken, newPassword, confirmPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "Unable to reset password. Please request a new code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-white px-5 py-8 dark:bg-[#0B0F17]">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative h-14 w-14">
            <Image src="/images/atu-logo.png" alt="Abaarso Tech University official seal" fill className="object-contain" priority />
          </div>
          <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#90274F] dark:text-[#F7D9E4]">Abaarso Tech University</p>
        </div>

        <h1 className="text-xl font-black text-[#0F172A] sm:text-2xl dark:text-[#F8FAFC]">
          {step === "code" ? "Verify your code" : "Set a new password"}
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B] dark:text-[#94A3B8]">
          {step === "code"
            ? "Enter the 6-digit code sent to your email."
            : "Choose a strong new password for your account."}
        </p>

        {success ? (
          <div className="mt-6 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-4 text-sm text-[#0F172A] dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F1F5F9]">
            Password reset successfully. Redirecting to sign in...
          </div>
        ) : error ? (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-[#991B1B] dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300" role="alert">
            {error}
          </div>
        ) : null}

        {!success && step === "code" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleVerifyCode}>
            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="email">
              Email address
              <input
                id="email"
                className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="code">
              Verification code
              <input
                id="code"
                className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-center text-lg font-bold tracking-[0.5em] text-[#0F172A] outline-none transition-colors focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                required
              />
            </label>

            <Button className="h-11 w-full rounded-xl" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        ) : null}

        {!success && step === "password" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleResetPassword}>
            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="newPassword">
              New password
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
                <input
                  id="newPassword"
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-11 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#B72E5F] dark:text-[#94A3B8] dark:hover:text-[#C53668]"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="confirmPassword">
              Confirm password
              <input
                id="confirmPassword"
                className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Must be at least 8 characters with an uppercase letter, a lowercase letter, and a number.
            </p>

            <Button className="h-11 w-full rounded-xl" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : null}

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-[#90274F] dark:text-[#94A3B8] dark:hover:text-[#F7D9E4]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
