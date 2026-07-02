"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import PasswordStrengthBar from "@/components/ui/PasswordStrengthBar";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

// ─── Validation schema ────────────────────────────────────────────────────────
const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

// ─── Reusable field wrapper ───────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-300 select-none">
        {label}
      </label>
      {children}
      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5"
        >
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Input class helper ───────────────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return [
    "w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-white text-sm",
    "placeholder-gray-600 outline-none transition-all duration-200",
    "hover:border-white/20 focus:ring-2 focus:ring-purple-500/20",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-white/[0.09] focus:border-purple-500/70",
  ].join(" ");
}

// ─── Google icon ─────────────────────────────────────────────────────────────
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

// ─── Loading spinner ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");
  const termsChecked = watch("terms");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.message || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created! Redirecting to login…");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      toast.error("Unable to connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors closeButton />

      <div
        className="min-h-screen flex flex-col"
        style={{
          background:
            "radial-gradient(ellipse at 50% -5%, #1e1040 0%, #0b0e18 55%)",
        }}
      >
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">

            {/* ── Brand ── */}
            <div className="text-center mb-8">
              <div
                // className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 shadow-lg shadow-purple-900/40"
                // style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                // aria-hidden="true"
              >
                {/* <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-3v3a1 1 0 01-2 0v-3H8a1 1 0 010-2h3V8a1 1 0 012 0v3h3a1 1 0 010 2z" />
                </svg> */}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">RediX</h1>
            </div>

            {/* ── Card ── */}
            <div
              className="rounded-2xl border border-white/[0.07] px-6 sm:px-8 py-8 shadow-2xl shadow-black/40"
              style={{
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(24px)",
              }}
            >
              <h2 className="text-xl font-semibold text-white text-center mb-1">
                Create your account
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Join the Redix ecosystem and start exploring.
              </p>

              {/* ── Google button ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                aria-label="Continue with Google"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/[0.1] text-gray-300 text-sm font-medium transition-all duration-200 hover:bg-white/[0.06] hover:border-white/20 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 my-5" aria-hidden="true">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-gray-600 text-xs font-medium uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>

              {/* ── Form ── */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
                aria-label="Sign up form"
              >
                {/* Username */}
                <Field id="username" label="Username" error={errors.username?.message}>
                  <input
                    {...register("username")}
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. redix_user"
                    aria-describedby={errors.username ? "username-error" : undefined}
                    aria-invalid={!!errors.username}
                    className={inputCls(!!errors.username)}
                  />
                </Field>

                {/* Email */}
                <Field id="email" label="Email Address" error={errors.email?.message}>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-invalid={!!errors.email}
                    className={inputCls(!!errors.email)}
                  />
                </Field>

                {/* Password */}
                <Field id="password" label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      aria-describedby={errors.password ? "password-error" : undefined}
                      aria-invalid={!!errors.password}
                      className={inputCls(!!errors.password) + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus-visible:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordValue.length > 0 && (
                    <PasswordStrengthBar password={passwordValue} />
                  )}
                </Field>

                {/* Confirm Password */}
                <Field
                  id="confirmPassword"
                  label="Confirm Password"
                  error={errors.confirmPassword?.message}
                >
                  <div className="relative">
                    <input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                      aria-invalid={!!errors.confirmPassword}
                      className={inputCls(!!errors.confirmPassword) + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus-visible:outline-none"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group" htmlFor="terms">
                    {/* Custom checkbox */}
                    <div className="relative flex-shrink-0 mt-0.5 w-4 h-4">
                      <div
                        className={[
                          "absolute inset-0 rounded border transition-all duration-200",
                          "flex items-center justify-center pointer-events-none",
                          termsChecked
                            ? "bg-purple-600 border-purple-600"
                            : "border-white/20 group-hover:border-white/40",
                          errors.terms && !termsChecked ? "border-red-500/60" : "",
                        ].join(" ")}
                      >
                        {termsChecked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <input
                        {...register("terms")}
                        id="terms"
                        type="checkbox"
                        aria-describedby={errors.terms ? "terms-error" : undefined}
                        aria-invalid={!!errors.terms}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>

                    <span className="text-gray-400 text-xs leading-relaxed select-none">
                      I agree to the{" "}
                      <Link
                        href="#"
                        className="text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="#"
                        className="text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  {errors.terms && (
                    <div
                      id="terms-error"
                      role="alert"
                      aria-live="polite"
                      className="flex items-center gap-1.5 mt-1.5 ml-7"
                    >
                      <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{errors.terms.message}</p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-label="Create account"
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 shadow-lg shadow-purple-900/30"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* ── Sign in link ── */}
              <p className="text-center text-gray-500 text-sm mt-6">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="text-center py-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-gray-700 text-xs">
          <span>© 2024 RediX Ecosystem. All rights reserved.</span>
          <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-gray-400 transition-colors">Help Center</Link>
        </footer>
      </div>
    </>
  );
}
