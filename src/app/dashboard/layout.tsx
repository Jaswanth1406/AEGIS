"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  X,
} from "lucide-react";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const userName = session?.user?.name || "Analyst";
  const userEmail = session?.user?.email || "analyst@aegis-ai.com";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const activeLabel = useMemo(() => {
    const hit = navLinks.find((l) => pathname === l.href);
    return hit?.label || "Dashboard";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Fixed header (STREAM-like) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 header-blur border-b border-border">
        <div className="h-16 flex items-center gap-3 px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text transition-colors"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wider text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                AEGIS AI
              </div>
              <div className="text-[10px] text-muted uppercase tracking-widest" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                {activeLabel}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 border border-border text-xs text-muted min-w-[240px]">
            <span className="opacity-70" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
              aegis.local/dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/30">
              <div className="w-2 h-2 rounded-full bg-accent-green pulse-live"></div>
              <span className="text-xs font-semibold text-accent-green" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                LIVE MONITORING
              </span>
            </div>

            <button className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-text transition-colors" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface2 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center overflow-hidden">
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-accent-green">{userInitials}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-text leading-4">{userName}</div>
                  <div className="text-[10px] text-muted leading-4" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                    Investigator
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl py-2 animate-slide-down">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-text truncate">{userName}</p>
                    <p className="text-xs text-muted truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-accent-green hover:bg-surface2 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-red hover:bg-accent-red/5 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar (STREAM-like) */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-72 bg-surface/95 header-blur border-r border-border transition-transform lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4">
            <div className="text-[10px] text-muted uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
              Navigation
            </div>
          </div>

          <nav className="px-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "text-muted hover:text-text hover:bg-surface2"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center overflow-hidden">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-extrabold text-accent-green">{userInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text truncate">{userName}</div>
                <div className="text-xs text-muted truncate" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                  {userEmail}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-red/10 text-accent-red border border-accent-red/25 hover:bg-accent-red/15 transition-colors text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          className="fixed inset-0 top-16 z-30 bg-black/10 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Main content area */}
      <main className="pt-16 min-h-screen grid-bg">
        <div className="lg:pl-72">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
