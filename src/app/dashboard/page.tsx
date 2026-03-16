"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, Zap, CheckCircle, X, ChevronRight, Play } from "lucide-react";
import { threats as initialThreats, playbooks, attackOrigins, protectedTargets, aiExplanations, generateNewThreat, type Threat } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import AttackGlobe from "@/components/dashboard-attack-globe";

// Severity config
const severityConfig = {
  CRITICAL: { color: "text-accent-red", bg: "bg-accent-red/10", border: "border-accent-red/30", glow: "glow-red" },
  HIGH: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "" },
  MEDIUM: { color: "text-accent-yellow", bg: "bg-accent-yellow/10", border: "border-accent-yellow/30", glow: "glow-yellow" },
  LOW: { color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/30", glow: "" },
};

const statusColors: Record<string, string> = {
  Investigating: "text-accent-yellow",
  Contained: "text-accent-blue",
  Blocked: "text-accent-green",
  Active: "text-accent-red",
};

function formatTime(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
}

// Stat Card Component
function StatCard({ icon, label, value, color, glowClass }: { icon: React.ReactNode; label: string; value: string; color: string; glowClass: string }) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const num = parseInt(value);
    if (isNaN(num)) {
      setDisplayValue(value);
      return;
    }
    let current = 0;
    const step = Math.ceil(num / 30);
    const interval = setInterval(() => {
      current += step;
      if (current >= num) {
        setDisplayValue(String(num));
        clearInterval(interval);
      } else {
        setDisplayValue(String(current));
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className={`bg-surface rounded-xl border border-border p-5 ${glowClass} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`${color}`}>{icon}</span>
        <span className={`text-2xl font-bold ${color}`} style={{ fontFamily: "var(--font-space-mono), monospace" }}>{displayValue}</span>
      </div>
      <p className="text-muted text-sm">{label}</p>
    </div>
  );
}

// Threat Card
function ThreatCard({ threat, onClick }: { threat: Threat; onClick: () => void }) {
  const config = severityConfig[threat.severity];
  return (
    <div
      onClick={onClick}
      className="bg-surface2 rounded-lg p-4 border border-border hover:border-accent-green/30 cursor-pointer transition-all hover:shadow-sm animate-slide-down"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text">{threat.name}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.color}`}>
          {threat.severity}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
        <span>IP: {threat.sourceIP}</span>
        <span>→ {threat.targetSystem}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted">{formatTime(threat.timestamp)}</span>
        <span className={`text-xs font-medium ${statusColors[threat.status]}`}>{threat.status}</span>
      </div>
    </div>
  );
}

// Threat Drawer
function ThreatDrawer({ threat, onClose }: { threat: Threat | null; onClose: () => void }) {
  if (!threat) return null;
  const config = severityConfig[threat.severity];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border-l border-border overflow-y-auto animate-slide-in-right shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Threat Details</h2>
            <button onClick={onClose} className="text-muted hover:text-text"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${config.bg} ${config.color}`}>{threat.severity}</span>
              <h3 className="text-xl font-bold text-text mt-2">{threat.name}</h3>
              <p className="text-muted text-sm mt-1" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{threat.id} · {threat.type}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-xl border border-border space-y-3">
              <div className="flex justify-between"><span className="text-muted text-sm">Source IP</span><span className="text-text text-sm" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{threat.sourceIP}</span></div>
              <div className="flex justify-between"><span className="text-muted text-sm">Target</span><span className="text-text text-sm">{threat.targetSystem}</span></div>
              <div className="flex justify-between"><span className="text-muted text-sm">Status</span><span className={`text-sm font-medium ${statusColors[threat.status]}`}>{threat.status}</span></div>
              <div className="flex justify-between"><span className="text-muted text-sm">Time</span><span className="text-text text-sm">{formatTime(threat.timestamp)}</span></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Description</h4>
              <p className="text-muted text-sm">{threat.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Attack Vector</h4>
              <p className="text-accent-green text-sm">{threat.details.attackVector}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Indicators</h4>
              <div className="flex flex-wrap gap-2">
                {threat.details.indicators.map((ind) => (
                  <span key={ind} className="text-xs px-2 py-1 rounded-lg bg-surface2 border border-border text-muted">{ind}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Affected Systems</h4>
              <div className="space-y-1">
                {threat.details.affectedSystems.map((sys) => (
                  <div key={sys} className="text-sm text-muted flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-red"></div>{sys}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-2">Recommended Action</h4>
              <p className="text-muted text-sm">{threat.details.recommendedAction}</p>
            </div>
            <button className="w-full py-3 bg-accent-red/10 text-accent-red font-semibold rounded-xl hover:bg-accent-red/20 transition-all border border-accent-red/30 flex items-center justify-center gap-2">
              <Play className="h-4 w-4" /> Execute Response Playbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [threatList, setThreatList] = useState<Threat[]>(initialThreats);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [playbookStates, setPlaybookStates] = useState<Record<string, "idle" | "loading" | "done">>({});

  // Add new threat every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatList((prev) => [generateNewThreat(), ...prev]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const executePlaybook = useCallback((id: string) => {
    setPlaybookStates((p) => ({ ...p, [id]: "loading" }));
    setTimeout(() => {
      setPlaybookStates((p) => ({ ...p, [id]: "done" }));
      setTimeout(() => setPlaybookStates((p) => ({ ...p, [id]: "idle" })), 3000);
    }, 2000);
  }, []);

  const criticalCount = threatList.filter((t) => t.severity === "CRITICAL").length;
  const activeAlerts = threatList.filter((t) => t.status === "Active" || t.status === "Investigating").length;
  const containedCount = 847;

  return (
    <div className="space-y-6 fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Critical Threats" value={String(criticalCount)} color="text-accent-red" glowClass="glow-red" />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Active Alerts" value={String(activeAlerts)} color="text-accent-yellow" glowClass="glow-yellow" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Threats Contained" value={String(containedCount)} color="text-accent-green" glowClass="glow-green" />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Avg Response Time" value="<1ms" color="text-accent-blue" glowClass="glow-blue" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Threat Feed */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Live Threat Feed</h3>
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse-dot"></div>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {threatList.slice(0, 10).map((threat) => (
              <ThreatCard key={threat.id} threat={threat} onClick={() => setSelectedThreat(threat)} />
            ))}
          </div>
        </div>

        {/* Global Attack Map */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Global Attack Map</h3>
          <div className="rounded-lg overflow-hidden bg-surface2" style={{ height: 400 }}>
            <AttackGlobe attackOrigins={attackOrigins} protectedTargets={protectedTargets} />
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-red"></div>
              <span>Attack Origin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-blue"></div>
              <span>Protected Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Threat Analysis */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-text mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>AI Threat Analysis</h3>
          <p className="text-muted text-sm mb-4">Most recent critical threat analysis</p>
          <div className="bg-surface2 p-4 rounded-xl border border-border mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-text">Data Exfiltration Attempt</h4>
                <p className="text-xs text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>THR-001</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-accent-red" style={{ fontFamily: "var(--font-space-mono), monospace" }}>94%</span>
                <p className="text-xs text-muted">Confidence</p>
              </div>
            </div>
            <p className="text-xs text-muted mb-3">Why was this flagged?</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={aiExplanations} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6b7394" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="factor" width={160} tick={{ fontSize: 11, fill: "#1a1f36" }} axisLine={false} tickLine={false} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                  {aiExplanations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="w-full py-2.5 bg-accent-red/10 text-accent-red font-medium rounded-xl hover:bg-accent-red/20 transition-all border border-accent-red/30 flex items-center justify-center gap-2 text-sm">
            Execute Playbook <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Response Playbooks */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Response Playbooks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playbooks.map((pb) => {
              const state = playbookStates[pb.id] || "idle";
              return (
                <div key={pb.id} className="bg-surface2 rounded-xl border border-border p-4 hover:border-accent-green/30 transition-all">
                  <div className="text-2xl mb-2">{pb.icon}</div>
                  <h4 className="text-sm font-medium text-text mb-1">{pb.name}</h4>
                  <p className="text-xs text-muted mb-3">{pb.description}</p>
                  <button
                    onClick={() => executePlaybook(pb.id)}
                    disabled={state !== "idle"}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      state === "done"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/30"
                        : state === "loading"
                        ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30"
                        : "bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20"
                    }`}
                  >
                    {state === "loading" ? (
                      <><div className="w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin-slow"></div> Executing...</>
                    ) : state === "done" ? (
                      <><CheckCircle className="h-3 w-3" /> Executed</>
                    ) : (
                      "Execute"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Threat Drawer */}
      <ThreatDrawer threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
    </div>
  );
}
