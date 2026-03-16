"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, AlertTriangle, BookOpen, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Threats", href: "/dashboard/threats", icon: AlertTriangle },
  { label: "Playbooks", href: "/dashboard/playbooks", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-navy">
      {/* Dashboard Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-teal" />
              <span className="text-lg font-bold text-white hidden sm:block">AEGIS AI</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-teal/10 text-teal"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* LIVE Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-critical/10 border border-critical/30">
                <div className="w-2 h-2 rounded-full bg-critical animate-pulse-glow"></div>
                <span className="text-xs font-semibold text-critical">LIVE</span>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-teal" />
                  </div>
                  <span className="text-sm text-text-primary hidden sm:block">Alex Morgan</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl shadow-navy/50 py-2 animate-slide-down">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-white">Alex Morgan</p>
                      <p className="text-xs text-text-muted">alex.morgan@aegis-ai.com</p>
                    </div>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-teal hover:bg-white/5 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-critical hover:bg-critical/10 transition-colors">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
