"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, Check, X, Shield } from "lucide-react";
import { signUp, signIn } from "@/lib/auth-client";

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\\/~`]/.test(password),
  }), [password]);

  const strength = useMemo(() => {
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed === 0) return { label: "", color: "", width: "0%", barColor: "" };
    if (passed === 1) return { label: "Weak", color: "text-accent-red", width: "25%", barColor: "bg-accent-red" };
    if (passed === 2) return { label: "Fair", color: "text-accent-yellow", width: "50%", barColor: "bg-accent-yellow" };
    if (passed === 3) return { label: "Strong", color: "text-accent-green", width: "75%", barColor: "bg-accent-green" };
    return { label: "Very Strong", color: "text-accent-green", width: "100%", barColor: "bg-accent-green" };
  }, [checks]);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted">Password Strength</span>
          <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${strength.barColor}`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
      {/* Requirements Checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "At least 8 characters", met: checks.minLength },
          { label: "One uppercase letter", met: checks.hasUppercase },
          { label: "One number", met: checks.hasNumber },
          { label: "One special character", met: checks.hasSpecial },
        ].map((req) => (
          <div key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-accent-green flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted flex-shrink-0" />
            )}
            <span className={req.met ? "text-accent-green" : "text-muted"}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const passwordValid = useMemo(() => {
    const p = form.password;
    return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\\/~`]/.test(p);
  }, [form.password]);

  const formValid = useMemo(() => {
    return form.name.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
      passwordValid &&
      form.password === form.confirmPassword &&
      agreeTerms;
  }, [form, passwordValid, agreeTerms]);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (!passwordValid) e.password = "Password doesn't meet requirements";
    if (!form.confirmPassword) e.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!agreeTerms) e.terms = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      });
      if (result.error) {
        setErrors({ general: result.error.message || "Registration failed" });
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setErrors({ general: "Google sign-up failed. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden py-20 grid-bg">
      {/* Floating Orbs */}
      <div className="orb orb-green" style={{ width: 400, height: 400, top: -100, right: -100 }} />
      <div className="orb orb-purple" style={{ width: 300, height: 300, bottom: 100, left: -50 }} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 header-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>AEGIS AI</span>
          </Link>
        </div>
      </nav>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md px-4 fade-in">
        <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-9 w-9 text-accent-green" />
            </div>
            <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Create Account</h1>
            <p className="text-muted text-sm mt-1">Join the Autonomous Cyber-Immune Platform</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 flex items-center gap-2 text-sm text-accent-red animate-slide-down">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{errors.general}
            </div>
          )}

          {/* Google Sign Up */}
          <button onClick={handleGoogleSignUp} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface2 text-text font-medium rounded-xl hover:bg-border/50 transition-all mb-6 border border-border">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-surface text-muted">or register with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.name ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <User className="h-5 w-5 text-muted" />
                <input type="text" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm" />
              </div>
              {errors.name && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.email ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <Mail className="h-5 w-5 text-muted" />
                <input type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm" />
              </div>
              {errors.email && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.password ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <Lock className="h-5 w-5 text-muted" />
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted hover:text-accent-green transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
              <PasswordStrengthMeter password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.confirmPassword ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <Lock className="h-5 w-5 text-muted" />
                <input type={showConfirm ? "text" : "password"} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted hover:text-accent-green transition-colors">
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => { setAgreeTerms(e.target.checked); setErrors((p) => ({ ...p, terms: "" })); }}
                className="mt-0.5 h-4 w-4 rounded border-border bg-surface2 accent-accent-green"
              />
              <label htmlFor="terms" className="text-sm text-muted">
                I agree to the <a href="#" className="text-accent-green hover:underline">Terms of Service</a> and <a href="#" className="text-accent-green hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && <p className="text-accent-red text-xs ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.terms}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={!formValid || loading}
              className="w-full py-3 bg-accent-green text-white font-semibold rounded-xl hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-green hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
