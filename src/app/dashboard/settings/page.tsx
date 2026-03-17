"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Bell, Moon, Sun, Save, CheckCircle, Database, UploadCloud, Cpu } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testSlackSending, setTestSlackSending] = useState(false);
  const [testResult, setTestResult] = useState<{ type: "email" | "slack"; ok: boolean; message: string } | null>(null);
  
  const [settings, setSettings] = useState({
    name: "Loading...",
    email: "loading...",
    role: "Security Analyst",
    emailNotifications: true,
    criticalAlerts: true,
    weeklyReport: true,
    slackIntegration: false,
    slackWebhookUrl: "",
    twoFactor: false, // Better Auth 2FA requires plugin
    sessionTimeout: "30",
  });

  // Track if we made changes
  const [hasChanges, setHasChanges] = useState(false);

  const [modelStatus, setModelStatus] = useState({
    active_model: "general",
    is_training: false,
    custom_model_available: false,
  });
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll model status
  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        const apiUrl = "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/api/model/status`);
        if (res.ok) {
          const data = await res.json();
          setModelStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch model status", err);
      }
    };

    fetchModelStatus();
    const interval = setInterval(fetchModelStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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
                 emailNotifications: data.emailNotifications !== false,
                 criticalAlerts: data.criticalAlerts !== false,
                 weeklyReport: data.weeklyReport !== false,
                 slackIntegration: !!data.slackIntegration,
                 slackWebhookUrl: data.slackWebhookUrl || "",
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

  const toggleSetting = (key: "emailNotifications" | "criticalAlerts" | "weeklyReport" | "slackIntegration") => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
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
          darkMode: resolvedTheme === "dark",
          emailNotifications: settings.emailNotifications,
          criticalAlerts: settings.criticalAlerts,
          weeklyReport: settings.weeklyReport,
          slackIntegration: settings.slackIntegration,
          slackWebhookUrl: settings.slackWebhookUrl,
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

  const sendTestEmail = async () => {
    setTestResult(null);
    setTestEmailSending(true);
    try {
      const res = await fetch("/api/notifications/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.reason || "Failed to send test email");
      }
      setTestResult({ type: "email", ok: true, message: "Test email sent successfully." });
    } catch (err: any) {
      setTestResult({ type: "email", ok: false, message: err?.message || "Failed to send test email." });
    } finally {
      setTestEmailSending(false);
    }
  };

  const sendTestSlack = async () => {
    setTestResult(null);
    setTestSlackSending(true);
    try {
      const res = await fetch("/api/notifications/test-slack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.reason || "Failed to send test Slack message");
      }
      setTestResult({ type: "slack", ok: true, message: "Test Slack alert sent successfully." });
    } catch (err: any) {
      setTestResult({ type: "slack", ok: false, message: err?.message || "Failed to send test Slack message." });
    } finally {
      setTestSlackSending(false);
    }
  };

  const handleModelSwitch = async (type: "general" | "custom") => {
    try {
      const apiUrl = "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/model/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_type: type })
      });
      if (res.ok) {
        setModelStatus(s => ({ ...s, active_model: type }));
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to switch model.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadMessage("Only CSV files are allowed.");
      return;
    }

    setUploadingDataset(true);
    setUploadMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/model/upload_and_train`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage("Training started successfully! This may take a few minutes.");
        setModelStatus(s => ({ ...s, is_training: true }));
      } else {
        setUploadMessage(`Error: ${data.detail || "Failed to start training."}`);
      }
    } catch (err) {
      console.error(err);
      setUploadMessage("Error uploading dataset.");
    } finally {
      setUploadingDataset(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
                  onChange={(e) => {
                    setSettings((s) => ({ ...s, name: e.target.value }));
                    setHasChanges(true);
                  }}
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
                  onChange={(e) => {
                    setSettings((s) => ({ ...s, email: e.target.value }));
                    setHasChanges(true);
                  }}
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
                onClick={() => toggleSetting(item.key as "emailNotifications" | "criticalAlerts" | "weeklyReport" | "slackIntegration")}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings[item.key as keyof typeof settings] ? "bg-accent-green" : "bg-border"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          ))}

          {settings.slackIntegration && (
            <div>
              <label className="text-sm text-muted mb-1.5 block">Slack Webhook URL</label>
              <input
                type="url"
                value={settings.slackWebhookUrl}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, slackWebhookUrl: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface2 text-text text-sm outline-none focus:border-accent-green transition-colors"
              />
            </div>
          )}

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted mb-2">Verify integrations</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={sendTestEmail}
                disabled={testEmailSending}
                className="px-3 py-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 text-accent-blue text-xs font-semibold hover:bg-accent-blue/20 transition-colors disabled:opacity-60"
              >
                {testEmailSending ? "Sending Email..." : "Send Test Email"}
              </button>
              <button
                onClick={sendTestSlack}
                disabled={testSlackSending}
                className="px-3 py-2 rounded-lg border border-accent-green/30 bg-accent-green/10 text-accent-green text-xs font-semibold hover:bg-accent-green/20 transition-colors disabled:opacity-60"
              >
                {testSlackSending ? "Sending Slack..." : "Send Test Slack"}
              </button>
            </div>

            {testResult && (
              <p className={`mt-2 text-xs ${testResult.ok ? "text-accent-green" : "text-accent-red"}`}>
                {testResult.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Model & Data Ingestion */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-accent-green" /> Model & Data Ingestion
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface2">
            <div>
              <h3 className="text-sm font-medium text-text flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Active Model
              </h3>
              <p className="text-xs text-muted mt-1">
                Choose between the pre-trained general model or your custom trained model.
              </p>
            </div>
            
            <div className="flex bg-surface border border-border rounded-lg p-1 overflow-hidden">
              <button 
                onClick={() => handleModelSwitch("general")}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${modelStatus.active_model === "general" ? "bg-accent-green text-white" : "text-muted hover:text-text"}`}
              >
                General
              </button>
              <button 
                onClick={() => handleModelSwitch("custom")}
                disabled={!modelStatus.custom_model_available && modelStatus.active_model !== "custom"}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${modelStatus.active_model === "custom" ? "bg-accent-green text-white" : "text-muted hover:text-text"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Custom Model
              </button>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-medium text-text mb-2">Train Custom Model</h3>
            <p className="text-xs text-muted mb-4">
              Upload your own CSV dataset containing flow features and standard labels. The system will automatically train a new custom threat detection model.
            </p>
            
            <div className="flex flex-col gap-3">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              {modelStatus.is_training ? (
                <div className="flex items-center gap-3 p-4 border border-accent-blue/30 bg-accent-blue/10 rounded-xl text-accent-blue text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
                  Custom model is currently training in the background. Please wait...
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDataset}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-border hover:border-accent-green bg-surface2 hover:bg-surface rounded-xl transition-all text-sm text-text"
                >
                  <UploadCloud className="h-5 w-5 text-muted" />
                  {uploadingDataset ? "Uploading..." : "Upload CSV & Train Model"}
                </button>
              )}
              
              {uploadMessage && (
                <p className={`text-xs ${uploadMessage.includes("Error") ? "text-accent-red" : "text-accent-green"}`}>
                  {uploadMessage}
                </p>
              )}
            </div>
          </div>
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
