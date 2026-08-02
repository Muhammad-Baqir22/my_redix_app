"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--text-2)] select-none">
        {label}
      </label>
      {children}
      {error && (
        <div id={`${id}-error`} role="alert" aria-live="polite" className="flex items-center gap-1.5">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full bg-[var(--bg-input)] border rounded-xl px-4 py-2.5 text-[var(--text-1)] text-sm",
    "placeholder-[var(--text-3)] outline-none transition-all duration-200",
    "hover:border-[var(--border)] focus:ring-2 focus:ring-purple-500/20",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[var(--border)] focus:border-purple-500/70",
  ].join(" ");
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107" />
      <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" fill="#FF3D00" />
      <path d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.5C29.6 36.1 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-7.5l-7 5.4C8.3 41.3 15.5 45 24 45z" fill="#4CAF50" />
      <path d="M44.5 20H24v8.5h11.8c-.6 2.1-1.9 3.9-3.6 5.2l6.6 5.5C42.6 36.2 45 30.5 45 24c0-1.4-.2-2.7-.5-4z" fill="#1976D2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberChecked, setRememberChecked] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const idToken = await result.user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.message ?? "Google sign-in failed"); return; }
      localStorage.setItem("token", json.data.token);
      localStorage.setItem("username", json.data.user.username);
      localStorage.setItem("email", json.data.user.email);
      localStorage.setItem("userId", json.data.user.id);
      router.push("/");
    }).catch(() => toast.error("Google sign-in failed. Please try again."));
  }, [router]);

  const handleGoogleSignIn = () => {
    signInWithRedirect(auth, googleProvider).catch(() =>
      toast.error("Google sign-in failed. Please try again.")
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Invalid credentials. Please try again.");
        return;
      }

      const storage = data.rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", json.data?.token ?? "");
      storage.setItem("username", json.data?.user?.username ?? "");
      storage.setItem("email", json.data?.user?.email ?? "");
      storage.setItem("userId", json.data?.user?.id ?? "");

      toast.success("Welcome back! Redirecting…");
      setTimeout(() => router.push("/"), 1500);
    } catch {
      toast.error("Unable to connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">

            {/* Brand */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--text-1)] tracking-tight">RediX</h1>
            </div>

            {/* Card */}
            <div
              className="rounded-2xl border border-[var(--border)] px-6 sm:px-8 py-8 shadow-2xl shadow-black/20"
              style={{ background: "var(--bg-card)", backdropFilter: "blur(24px)" }}
            >
              <h2 className="text-xl font-semibold text-[var(--text-1)] text-center mb-1">
                Welcome back
              </h2>
              <p className="text-[var(--text-3)] text-sm text-center mb-6">
                Enter your credentials to access the ecosystem.
              </p>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                aria-label="Continue with Google"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border)] text-[var(--text-2)] text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5" aria-hidden="true">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-[var(--text-3)] text-xs font-medium uppercase tracking-widest">or continue with</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
                aria-label="Sign in form"
              >
                <Field id="email" label="Email or Username" error={errors.email?.message}>
                  <input
                    {...register("email")}
                    id="email"
                    type="text"
                    autoComplete="email"
                    placeholder="name@company.com"
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-invalid={!!errors.email}
                    className={inputCls(!!errors.email)}
                  />
                </Field>

                <Field id="password" label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      aria-describedby={errors.password ? "password-error" : undefined}
                      aria-invalid={!!errors.password}
                      className={inputCls(!!errors.password) + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors focus-visible:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="rememberMe">
                    <div className="relative w-4 h-4 flex-shrink-0">
                      <div
                        className={[
                          "absolute inset-0 rounded border transition-all duration-200 flex items-center justify-center pointer-events-none",
                          rememberChecked
                            ? "bg-purple-600 border-purple-600"
                            : "border-[var(--border)] group-hover:border-purple-500/50",
                        ].join(" ")}
                      >
                        {rememberChecked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <input
                        {...register("rememberMe")}
                        id="rememberMe"
                        type="checkbox"
                        onChange={(e) => setRememberChecked(e.target.checked)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="text-[var(--text-3)] text-xs select-none">Remember me</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  aria-busy={isLoading}
                  aria-label="Sign in"
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 shadow-lg shadow-purple-900/30"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Signing in…
                    </>
                  ) : (
                    "Sign In →"
                  )}
                </button>
              </form>

              {/* Signup link */}
              <p className="text-center text-[var(--text-3)] text-sm mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[var(--text-3)] text-xs">
          <Link href="#" className="hover:text-[var(--text-2)] transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-[var(--text-2)] transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-[var(--text-2)] transition-colors">Status</Link>
        </footer>
      </div>
    </>
  );
}
