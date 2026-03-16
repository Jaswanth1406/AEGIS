"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, AlertTriangle, BookOpen, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Threats", href: "/dashboard/threats", icon: AlertTriangle },
  { label: "Playbooks", href: "/dashboard/playbooks", icon: BookOpen },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const userName = session?.user?.name || "Analyst";
  const userEmail = session?.user?.email || "analyst@aegis-ai.com";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      {/* Dashboard Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/95 header-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent-green flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-lg font-bold text-text hidden sm:block" style={{ fontFamily: "var(--font-syne), sans-serif" }}>AEGIS AI</span>
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
                        ? "bg-accent-green/10 text-accent-green"
                        : "text-muted hover:text-text hover:bg-surface2"
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/30">
                <div className="w-2 h-2 rounded-full bg-accent-green pulse-live"></div>
                <span className="text-xs font-semibold text-accent-green" style={{ fontFamily: "var(--font-space-mono), monospace" }}>LIVE</span>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center overflow-hidden">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-accent-green">{userInitials}</span>
                    )}
                  </div>
                  <span className="text-sm text-text hidden sm:block">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-muted" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl py-2 animate-slide-down">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text truncate">{userName}</p>
                      <p className="text-xs text-muted truncate">{userEmail}</p>
                    </div>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-accent-green hover:bg-surface2 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-red hover:bg-accent-red/5 transition-colors">
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
