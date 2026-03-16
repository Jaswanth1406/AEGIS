"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Bell, Moon, Sun, Save, CheckCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    name: "Loading...",
    email: "loading...",
    role: "Security Analyst",
    emailNotifications: true,
    criticalAlerts: true,
    weeklyReport: true,
    slackIntegration: false,
    twoFactor: false, // Better Auth 2FA requires plugin
    sessionTimeout: "30",
  });

  // Track if we made changes
  const [hasChanges, setHasChanges] = useState(false);

  // Sync session data when it loads
  useEffect(() => {
    setMounted(true);
    if (session?.user && !dataLoaded) {
      setSettings(s => ({
        ...s,
        name: session.user.name || "Unknown User",
        email: session.user.email || "No Email",
      }));
      
      // Fetch DB preferences
      fetch("/api/user/settings")
        .then(res => res.json())
        .then(data => {
            if (data && !data.error) {
               setSettings(s => ({
                 ...s,
                 sessionTimeout: data.sessionTimeout?.toString() || "30",
               }));
               if (data.darkMode !== undefined) {
                 setTheme(data.darkMode ? "dark" : "light");
               }
               setDataLoaded(true);
            }
        })
        .catch(console.error);
    }
  }, [session, setTheme, dataLoaded]);

  // Handle local dark mode toggle
  const toggleDarkMode = () => {
    const isDark = resolvedTheme === "dark";
    setTheme(isDark ? "light" : "dark");
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTimeout: settings.sessionTimeout,
          darkMode: resolvedTheme === "dark"
        })
      });
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your account and application preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-accent-green" /> Profile
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center">
              <User className="h-8 w-8 text-accent-green" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-text">{settings.name}</h3>
              <p className="text-sm text-muted">{settings.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1.5 block">Full Name</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface2 focus-within:border-accent-green transition-colors">
                <User className="h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                  className="flex-1 bg-transparent text-text outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted mb-1.5 block">Email</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface2 focus-within:border-accent-green transition-colors">
                <Mail className="h-4 w-4 text-muted" />
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
                  className="flex-1 bg-transparent text-text outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          {resolvedTheme === "dark" ? <Moon className="h-5 w-5 text-accent-green" /> : <Sun className="h-5 w-5 text-accent-green" />} Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Dark Mode</p>
            <p className="text-xs text-muted">Use dark theme across the application</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${resolvedTheme === "dark" ? "bg-accent-green" : "bg-border"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${resolvedTheme === "dark" ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent-green" /> Notifications
        </h2>
        <div className="space-y-4">
          {[
            { key: "emailNotifications", label: "Email Notifications", desc: "Receive threat alerts via email" },
            { key: "criticalAlerts", label: "Critical Alerts", desc: "Instant notifications for critical severity threats" },
            { key: "weeklyReport", label: "Weekly Report", desc: "Receive weekly security summary" },
            { key: "slackIntegration", label: "Slack Integration", desc: "Send alerts to Slack channel" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
              <button
                onClick={() => setSettings((s) => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings[item.key as keyof typeof settings] ? "bg-accent-green" : "bg-border"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent-green" /> Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text">Two-Factor Authentication</p>
              <p className="text-xs text-muted">Add an extra layer of security</p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, twoFactor: !s.twoFactor }))}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.twoFactor ? "bg-accent-green" : "bg-border"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${settings.twoFactor ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <div>
            <label className="text-sm text-muted mb-1.5 block">Session Timeout (minutes)</label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => {
                setSettings((s) => ({ ...s, sessionTimeout: e.target.value }));
                setHasChanges(true);
              }}
              className="px-4 py-3 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent-green transition-colors w-full sm:w-48"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {hasChanges && (
           <span className="text-sm text-accent-yellow flex items-center mr-2">Unsaved changes...</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-all text-sm ${
            saved
              ? "bg-accent-green/10 text-accent-green border border-accent-green/30"
              : (!hasChanges 
                   ? "bg-surface2 text-muted border border-border cursor-not-allowed" 
                   : "bg-accent-green text-white hover:bg-accent-green/90 shadow-lg shadow-accent-green/25")
          }`}
        >
          {saving ? "Saving..." : saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
