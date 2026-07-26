"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(requestError instanceof Error ? requestError.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#F5F7F9] lg:grid-cols-[1fr_0.9fr]">
      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <Image src="/image.png" alt="ABAARSO TECH UNIVERSITY logo" fill className="object-contain p-1" priority />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide text-[#15803D]">ABAARSO TECH UNIVERSITY</p>
              <h1 className="text-xl font-black text-[#111827]">Examination System</h1>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-wide text-[#15803D]">Secure portal</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#111827]">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">Use your university account to manage examinations, results, transcripts, and academic records.</p>

            {error ? (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#991B1B]" role="alert">
                {error}
              </div>
            ) : null}

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-bold text-[#111827]" htmlFor="email">
                Email address
                <span className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="email"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-10 pr-3 text-sm focus:border-[#16A34A]"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-bold text-[#111827]" htmlFor="password">
                Password
                <span className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="password"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-10 pr-11 text-sm focus:border-[#16A34A]"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]" type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Show or hide password">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4B5563]">
                  <input className="h-4 w-4 rounded border-[#D1D5DB] accent-[#16A34A]" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  Remember me
                </label>
                <Link className="text-sm font-bold text-[#15803D] hover:text-[#166534]" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <Button className="mt-2 w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-[#6B7280]">
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
            Protected by JWT authentication and role-based access controls.
          </p>
        </div>
      </section>

      <aside className="hidden bg-[#07110D] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-white">
            <Image src="/image.png" alt="ATU logo" fill className="object-contain p-2" />
          </div>
          <p className="mt-10 text-sm font-black uppercase tracking-wide text-[#86EFAC]">University Examination and Result Management System</p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight">Professional academic operations for ATU staff and students.</h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">Manage students, courses, assessments, examinations, published results, transcripts, and institutional performance from one organised university portal.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Results", "Transcripts", "Reports"].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-black">ATU</p>
              <p className="mt-1 text-xs text-white/60">{item}</p>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
