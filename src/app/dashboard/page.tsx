"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, Zap, CheckCircle, Clock, X, ChevronRight, Play } from "lucide-react";
import { threats as initialThreats, playbooks, attackOrigins, protectedTargets, aiExplanations, generateNewThreat, type Threat } from "@/lib/mock-data";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Severity config
const severityConfig = {
  CRITICAL: { color: "text-critical", bg: "bg-critical/20", border: "border-critical/30", glow: "glow-critical" },
  HIGH: { color: "text-orange-400", bg: "bg-orange-400/20", border: "border-orange-400/30", glow: "" },
  MEDIUM: { color: "text-warning", bg: "bg-warning/20", border: "border-warning/30", glow: "glow-warning" },
  LOW: { color: "text-safe", bg: "bg-safe/20", border: "border-safe/30", glow: "" },
};

const statusColors: Record<string, string> = {
  Investigating: "text-warning",
  Contained: "text-teal",
  Blocked: "text-safe",
  Active: "text-critical",
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
    <div className={`bg-card rounded-xl border border-border p-5 ${glowClass} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`${color}`}>{icon}</span>
        <span className={`text-2xl font-bold ${color}`}>{displayValue}</span>
      </div>
      <p className="text-text-muted text-sm">{label}</p>
    </div>
  );
}

// Threat Card
function ThreatCard({ threat, onClick }: { threat: Threat; onClick: () => void }) {
  const config = severityConfig[threat.severity];
  return (
    <div
      onClick={onClick}
      className={`bg-navy/60 rounded-lg p-4 border border-border hover:border-teal/30 cursor-pointer transition-all hover:bg-navy/80 animate-slide-down`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text-primary">{threat.name}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.color}`}>
          {threat.severity}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>IP: {threat.sourceIP}</span>
        <span>→ {threat.targetSystem}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-muted">{formatTime(threat.timestamp)}</span>
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Threat Details</h2>
            <button onClick={onClose} className="text-text-muted hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${config.bg} ${config.color}`}>{threat.severity}</span>
              <h3 className="text-xl font-bold text-white mt-2">{threat.name}</h3>
              <p className="text-text-muted text-sm mt-1">{threat.id} · {threat.type}</p>
            </div>
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="flex justify-between"><span className="text-text-muted text-sm">Source IP</span><span className="text-text-primary text-sm font-mono">{threat.sourceIP}</span></div>
              <div className="flex justify-between"><span className="text-text-muted text-sm">Target</span><span className="text-text-primary text-sm">{threat.targetSystem}</span></div>
              <div className="flex justify-between"><span className="text-text-muted text-sm">Status</span><span className={`text-sm font-medium ${statusColors[threat.status]}`}>{threat.status}</span></div>
              <div className="flex justify-between"><span className="text-text-muted text-sm">Time</span><span className="text-text-primary text-sm">{formatTime(threat.timestamp)}</span></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
              <p className="text-text-muted text-sm">{threat.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Attack Vector</h4>
              <p className="text-teal text-sm">{threat.details.attackVector}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Indicators</h4>
              <div className="flex flex-wrap gap-2">
                {threat.details.indicators.map((ind) => (
                  <span key={ind} className="text-xs px-2 py-1 rounded-lg bg-navy border border-border text-text-muted">{ind}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Affected Systems</h4>
              <div className="space-y-1">
                {threat.details.affectedSystems.map((sys) => (
                  <div key={sys} className="text-sm text-text-muted flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-critical"></div>{sys}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Recommended Action</h4>
              <p className="text-text-muted text-sm">{threat.details.recommendedAction}</p>
            </div>
            <button className="w-full py-3 bg-critical/20 text-critical font-semibold rounded-xl hover:bg-critical/30 transition-all border border-critical/30 flex items-center justify-center gap-2">
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
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Critical Threats" value={String(criticalCount)} color="text-critical" glowClass="glow-critical" />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Active Alerts" value={String(activeAlerts)} color="text-warning" glowClass="glow-warning" />
        <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Threats Contained" value={String(containedCount)} color="text-safe" glowClass="glow-safe" />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Avg Response Time" value="<1ms" color="text-teal" glowClass="glow-teal" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Threat Feed */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Live Threat Feed</h3>
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse-dot"></div>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {threatList.slice(0, 10).map((threat) => (
              <ThreatCard key={threat.id} threat={threat} onClick={() => setSelectedThreat(threat)} />
            ))}
          </div>
        </div>

        {/* Global Attack Map */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Global Attack Map</h3>
          <div className="rounded-lg overflow-hidden bg-navy/50" style={{ height: 400 }}>
            <ComposableMap
              projectionConfig={{ scale: 140, center: [20, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1a2744"
                      stroke="#0d1529"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#243352", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
              {/* Attack Lines */}
              {attackOrigins.map((origin) =>
                protectedTargets.map((target) => (
                  <Line
                    key={`${origin.name}-${target.name}`}
                    from={origin.coordinates}
                    to={target.coordinates}
                    stroke="rgba(255, 59, 59, 0.2)"
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                ))
              )}
              {/* Attack Origins */}
              {attackOrigins.map((loc) => (
                <Marker key={loc.name} coordinates={loc.coordinates}>
                  <circle r={5} fill="#ff3b3b" opacity={0.8} className="animate-pulse-dot" />
                  <circle r={10} fill="none" stroke="#ff3b3b" strokeWidth={1} opacity={0.3} className="animate-pulse-glow" />
                  <text textAnchor="middle" y={-12} style={{ fontSize: 8, fill: "#ff3b3b", fontWeight: 600 }}>{loc.name}</text>
                </Marker>
              ))}
              {/* Protected Targets */}
              {protectedTargets.map((loc) => (
                <Marker key={loc.name} coordinates={loc.coordinates}>
                  <circle r={4} fill="#00d4ff" opacity={0.8} />
                  <circle r={8} fill="none" stroke="#00d4ff" strokeWidth={1} opacity={0.3} />
                  <text textAnchor="middle" y={-10} style={{ fontSize: 8, fill: "#00d4ff", fontWeight: 600 }}>{loc.name}</text>
                </Marker>
              ))}
            </ComposableMap>
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-critical"></div>
              <span>Attack Origin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal"></div>
              <span>Protected Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Threat Analysis */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-white mb-1">AI Threat Analysis</h3>
          <p className="text-text-muted text-sm mb-4">Most recent critical threat analysis</p>
          <div className="glass-card p-4 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-white">Data Exfiltration Attempt</h4>
                <p className="text-xs text-text-muted">THR-001</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-critical">94%</span>
                <p className="text-xs text-text-muted">Confidence</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-3">Why was this flagged?</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={aiExplanations} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="factor" width={160} tick={{ fontSize: 11, fill: "#e2e8f0" }} axisLine={false} tickLine={false} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                  {aiExplanations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <button className="w-full py-2.5 bg-critical/20 text-critical font-medium rounded-xl hover:bg-critical/30 transition-all border border-critical/30 flex items-center justify-center gap-2 text-sm">
            Execute Playbook <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Response Playbooks */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Response Playbooks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playbooks.map((pb) => {
              const state = playbookStates[pb.id] || "idle";
              return (
                <div key={pb.id} className="bg-navy/60 rounded-xl border border-border p-4 hover:border-teal/30 transition-all">
                  <div className="text-2xl mb-2">{pb.icon}</div>
                  <h4 className="text-sm font-medium text-white mb-1">{pb.name}</h4>
                  <p className="text-xs text-text-muted mb-3">{pb.description}</p>
                  <button
                    onClick={() => executePlaybook(pb.id)}
                    disabled={state !== "idle"}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      state === "done"
                        ? "bg-safe/20 text-safe border border-safe/30"
                        : state === "loading"
                        ? "bg-teal/10 text-teal border border-teal/30"
                        : "bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20"
                    }`}
                  >
                    {state === "loading" ? (
                      <><div className="w-3 h-3 border-2 border-teal border-t-transparent rounded-full animate-spin-slow"></div> Executing...</>
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
