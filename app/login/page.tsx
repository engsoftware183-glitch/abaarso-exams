"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ApiClientError } from "@/lib/api-client";
import { login } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      if (!remember) sessionStorage.setItem("atu_session_only", "true");
      router.push("/dashboard");
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
        if (requestError.payload?.recoveryAvailable) setShowRecovery(true);
      } else {
        setError(requestError instanceof Error ? requestError.message : "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-dvh min-h-screen w-full overflow-hidden bg-white dark:bg-[#0B0F17]">
      <aside className="loginVisual relative hidden h-full flex-col items-center justify-center px-6 text-center text-white md:flex md:w-[42%] md:px-6 lg:w-[45%] lg:px-8 xl:w-1/2">
        <Image
          src="/images/exam-login-background.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="loginVisualImage"
        />

        <div className="loginVisualOverlay" aria-hidden="true" />

        <div className="loginVisualContent relative flex flex-col items-center">
          <div className="relative h-22.5 w-22.5 shrink-0 overflow-hidden rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:h-32.5 md:w-32.5">
            <Image src="/images/atu-logo.png" alt="Abaarso Tech University official seal" fill className="object-cover" priority />
          </div>

          <h1 className="mt-6 text-base font-black uppercase tracking-wide text-white md:text-lg lg:text-xl">Abaarso Tech University</h1>

          <div className="mt-3 flex flex-col items-center gap-1 text-[11px] font-semibold tracking-[0.12em] text-[#F7D9E4] md:mt-4 md:text-xs lg:text-sm">
            <span>IMAGINE</span>
            <span>INNOVATE</span>
            <span>INSPIRE</span>
          </div>

          <div className="mt-4 h-px w-14 bg-white/30 md:mt-5" aria-hidden="true" />

          <p className="mt-4 text-xs font-medium text-white/80 md:mt-5">Examination Management System</p>
        </div>
      </aside>

      <section className="relative flex h-full w-full flex-1 items-center justify-center bg-white px-5 sm:px-6 md:px-8 dark:bg-[radial-gradient(circle_at_50%_20%,rgba(197,54,104,0.10),transparent_55%),linear-gradient(180deg,#0B0F17,#111827)]">
        <ThemeToggle className="absolute right-5 top-5 sm:right-6 sm:top-6" />

        <div className="relative w-full max-w-[420px] sm:max-w-[480px]">
          <div className="mb-4 flex flex-col items-center text-center sm:mb-5 md:hidden">
            <div className="relative h-22.5 w-22.5 overflow-hidden rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
              <Image src="/images/atu-logo.png" alt="Abaarso Tech University official seal" fill className="object-cover" priority />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-wide text-[#90274F] dark:text-[#F7D9E4]">Abaarso Tech University</p>
          </div>

          <h2 className="text-lg font-black text-[#0F172A] sm:text-xl md:text-2xl dark:text-[#F8FAFC]">Login to your account</h2>
          <p className="mt-1.5 text-xs text-[#64748B] sm:text-sm dark:text-[#94A3B8]">Enter your credentials to continue</p>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-[#991B1B] sm:text-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300" role="alert">
              {error}
            </div>
          ) : null}

          <form className="mt-4 grid gap-3 sm:mt-5 sm:gap-4" onSubmit={handleSubmit} noValidate>
            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="email">
              Email address
              <span className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
                <input
                  id="email"
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-3 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  aria-label="Email address"
                  aria-required="true"
                  required
                />
              </span>
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]" htmlFor="password">
              Password
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
                <input
                  id="password"
                  className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-11 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#B72E5F] focus:ring-2 focus:ring-[#B72E5F]/20 dark:border-[#334155] dark:bg-[#151B26] dark:text-[#F8FAFC] dark:focus:border-[#C53668] dark:focus:ring-[#C53668]/20"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-label="Password"
                  aria-required="true"
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors hover:text-[#B72E5F] dark:text-[#94A3B8] dark:hover:text-[#C53668]"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-[#4B5563] dark:text-[#94A3B8]">
              <input
                className="h-4 w-4 rounded border-[#CBD5E1] accent-[#B72E5F] dark:border-[#334155] dark:accent-[#C53668]"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>

            {showRecovery ? (
              <Link
                href="/forgot-password"
                className="-mt-1 text-xs font-semibold text-[#90274F] transition-colors hover:text-[#701F3D] hover:underline dark:text-[#F7D9E4] dark:hover:text-[#C53668]"
              >
                Forgot password?
              </Link>
            ) : null}

            <Button
              className="mt-1 h-11 w-full rounded-xl shadow-sm transition hover:shadow-md dark:bg-linear-to-r dark:from-[#C02F63] dark:to-[#94143F] dark:hover:brightness-110"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
