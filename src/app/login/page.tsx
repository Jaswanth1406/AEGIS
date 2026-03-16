"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Shield } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setErrors({ general: result.error.message || "Invalid email or password" });
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setErrors({ general: "Google sign-in failed. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden grid-bg">
      {/* Floating Orbs */}
      <div className="orb orb-green" style={{ width: 400, height: 400, top: -100, right: -100 }} />
      <div className="orb orb-blue" style={{ width: 300, height: 300, bottom: 100, left: -50 }} />

      {/* Minimal Navbar */}
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4 fade-in">
        <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-9 w-9 text-accent-green" />
            </div>
            <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Welcome Back</h1>
            <p className="text-muted text-sm mt-1">Autonomous Cyber-Immune Platform</p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 flex items-center gap-2 text-sm text-accent-red animate-slide-down">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface2 text-text font-medium rounded-xl hover:bg-border/50 transition-all mb-6 border border-border"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface text-muted">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.email ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <Mail className="h-5 w-5 text-muted" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm"
                />
              </div>
              {errors.email && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${errors.password ? "border-accent-red bg-accent-red/5" : "border-border bg-surface2"} focus-within:border-accent-green transition-colors`}>
                <Lock className="h-5 w-5 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className="flex-1 bg-transparent text-text placeholder-muted outline-none text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted hover:text-accent-green transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-red text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a href="#" className="text-sm text-accent-green hover:underline">Forgot password?</a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent-green text-white font-semibold rounded-xl hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent-green hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
