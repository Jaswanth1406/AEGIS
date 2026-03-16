"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, Shield, Zap, CheckCircle, X, ChevronRight, Play, Brain, BookOpen, Activity } from "lucide-react";
import { threats as initialThreats, playbooks, aiExplanations, generateNewThreat, type Threat, type AttackOrigin } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import AttackGlobe from "@/components/dashboard-attack-globe";
import { fetchDashboardStats, fetchThreats, fetchPlaybooks, executePlaybook as apiExecutePlaybook } from "@/lib/api-client";

// Utility to generate deterministic coordinates from an IP string
const generateIpCoordinates = (ip: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ip.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lon = (Math.abs(hash) % 360) - 180;
  const lat = (Math.abs(hash >> 8) % 130) - 60;
  return [lon, lat];
};

// Map backend target systems to fixed corporate locations
const getTargetCoordinates = (target: string): [number, number] => {
  const map: Record<string, [number, number]> = {
    "public-ingress-01": [-77.0369, 38.9072], // Washington DC
    "db-primary": [-0.1276, 51.5074],         // London
    "auth-gateway": [13.4050, 52.5200],       // Berlin
    "internal-api": [139.6917, 35.6895],      // Tokyo
    "vpn-endpoint": [-122.4194, 37.7749],     // San Francisco
  };
  return map[target] || [0, 0];
};

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
  const score = Math.round(
    typeof threat.details?.aiConfidence === "number"
      ? threat.details.aiConfidence
      : threat.severity === "CRITICAL"
        ? 92
        : threat.severity === "HIGH"
          ? 84
          : threat.severity === "MEDIUM"
            ? 72
            : 58
  );
  return (
    <div
      onClick={onClick}
      className="bg-surface2/40 rounded-xl p-3 border border-border/60 hover:border-accent-green/30 cursor-pointer transition-all hover:shadow-sm animate-slide-down flex items-center gap-3"
    >
      <div className="w-12 text-center">
        <div className={`text-lg font-bold ${config.color}`} style={{ fontFamily: "var(--font-space-mono), monospace" }}>
          {score}
        </div>
        <div className="text-[10px] text-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
          risk
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-text truncate">{threat.name}</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.color}`}>
            {threat.severity}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
          <span className="truncate">IP: {threat.sourceIP}</span>
          <span className="opacity-50">→</span>
          <span className="truncate">{threat.targetSystem}</span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted">{formatTime(threat.timestamp)}</span>
          <span className={`text-xs font-medium ${statusColors[threat.status]}`}>{threat.status}</span>
        </div>
      </div>

      <div className={`h-10 w-1.5 rounded-full ${config.bg} border ${config.border}`} />
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
  const [threatList, setThreatList] = useState<Threat[]>([]);
  const [playbookList, setPlaybookList] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [playbookStates, setPlaybookStates] = useState<Record<string, "idle" | "loading" | "done">>({});
  const [activeTab, setActiveTab] = useState<"live" | "analysis" | "playbooks">("live");
  const [mapSelection, setMapSelection] = useState<
    | { kind: "none" }
    | { kind: "location"; name: string; locType: "Origin" | "Target" }
    | { kind: "threat"; threat: Threat }
  >({ kind: "none" });
  
  // Stats state
  const [stats, setStats] = useState({
    criticalCount: 0,
    activeAlerts: 0,
    containedCount: 0,
    avgResponse: "<1ms"
  });

  const [useMock, setUseMock] = useState(false);
  
  // Live Map State
  const [liveOrigins, setLiveOrigins] = useState<AttackOrigin[]>([]);
  const [liveTargets, setLiveTargets] = useState<AttackOrigin[]>([]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, threatsData, playbooksData] = await Promise.all([
          fetchDashboardStats(),
          fetchThreats(1, 20),
          fetchPlaybooks()
        ]);

        if (playbooksData) {
          setPlaybookList(playbooksData);
        }

        if (threatsData.items && threatsData.items.length > 0) {
          // Map backend threats to frontend model
          const mappedThreats = threatsData.items.map((t: any) => ({
            id: `THR-${t.id || Math.floor(Math.random() * 1000)}`,
            name: t.threat_type || "Unknown Threat",
            type: t.threat_type || "Anomaly",
            severity: t.severity || "MEDIUM",
            status: t.status === "INVESTIGATING" ? "Investigating" : 
                    t.status === "CONTAINED" ? "Contained" : 
                    t.status === "RESOLVED" ? "Contained" : "Active",
            sourceIP: t.source_ip || "0.0.0.0",
            targetSystem: t.target_system || "Unknown",
            timestamp: t.timestamp ? new Date(t.timestamp.endsWith('Z') || t.timestamp.includes('+') ? t.timestamp : `${t.timestamp}Z`) : new Date(),
            description: t.explanation ? `Anomaly Score: ${t.anomaly_score}` : `Automated detection of ${t.threat_type}`,
            details: {
              attackVector: t.threat_type,
              indicators: ["Anomalous Traffic", "High Volume"],
              affectedSystems: [t.target_system || "Unknown"],
              recommendedAction: "Execute containment playbook.",
              aiConfidence: t.confidence_score ? t.confidence_score * 100 : 90
            }
          }));
          setThreatList(mappedThreats);
          
          // Populate initial map
          const initOrigins: AttackOrigin[] = [];
          const initTargets: AttackOrigin[] = [];
          mappedThreats.forEach((t: Threat) => {
             if (!initOrigins.find(o => o.name === t.sourceIP)) {
                initOrigins.push({ name: t.sourceIP, coordinates: generateIpCoordinates(t.sourceIP), type: "origin", threats: 1 });
             }
             if (!initTargets.find(o => o.name === t.targetSystem)) {
                initTargets.push({ name: t.targetSystem, coordinates: getTargetCoordinates(t.targetSystem), type: "target", threats: 1 });
             }
          });
          setLiveOrigins(initOrigins);
          setLiveTargets(initTargets);
          
        } else {
          // If backend has no data, just show empty
          setThreatList([]);
        }

        if (statsData) {
          setStats({
            criticalCount: statsData.critical_threats || 0,
            activeAlerts: statsData.active_alerts || 0,
            containedCount: statsData.threats_contained || 0,
            avgResponse: statsData.avg_response_time ? `${statsData.avg_response_time}ms` : "<1ms"
          });
        }
      } catch (err) {
        console.warn("Backend API unavailable, showing empty state:", err);
        setThreatList([]);
      }
    };
    loadData();
  }, []);

  // Use EventSource (SSE)
  useEffect(() => {
    // Connect to SSE stream
    try {
      const token = localStorage.getItem("platform_token") || "demo-token";
      const evtSource = new EventSource(`${process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000"}/api/threats/stream?token=${token}`);
      
      evtSource.addEventListener("threat.created", (e) => {
        try {
          const t = JSON.parse((e as MessageEvent).data).payload;
          const newThreat: Threat = {
            id: `THR-${t.id || Math.floor(Math.random() * 1000)}`,
            name: t.threat_type || "Anomaly",
            type: t.threat_type || "Anomaly",
            severity: t.severity || "MEDIUM",
            status: "Active",
            sourceIP: t.source_ip || "0.0.0.0",
            targetSystem: t.target_system || "Unknown",
            timestamp: t.timestamp ? new Date(t.timestamp.endsWith('Z') || t.timestamp.includes('+') ? t.timestamp : `${t.timestamp}Z`) : new Date(),
            description: t.explanation ? `Live Threat Detection` : `Automated detection of ${t.threat_type}`,
            details: {
              attackVector: t.threat_type || "Anomaly",
              indicators: ["Real-time Block"],
              affectedSystems: [t.target_system || "Unknown"],
              recommendedAction: "Review and isolate.",
              aiConfidence: t.confidence_score ? t.confidence_score * 100 : 90
            }
          };
          setThreatList(prev => [newThreat, ...prev]);
          
          // Increment active alerts natively when a new thread pops
          setStats(prev => ({
             ...prev, 
             activeAlerts: prev.activeAlerts + 1,
             criticalCount: t.severity === "CRITICAL" ? prev.criticalCount + 1 : prev.criticalCount
          }));

          // Add to map
          setLiveOrigins(prev => {
            if (prev.find(p => p.name === newThreat.sourceIP)) return prev;
            return [...prev.slice(-15), { // Keep max 15 origins visible directly
              name: newThreat.sourceIP,
              coordinates: generateIpCoordinates(newThreat.sourceIP),
              type: "origin",
              threats: 1
            }];
          });
          setLiveTargets(prev => {
            if (prev.find(p => p.name === newThreat.targetSystem)) return prev;
            return [...prev, {
              name: newThreat.targetSystem,
              coordinates: getTargetCoordinates(newThreat.targetSystem),
              type: "target",
              threats: 1
            }];
          });
        } catch(err) {
          console.error("Error parsing SSE data", err);
        }
      });

      // Cleanup
      return () => evtSource.close();
    } catch(err) {
      console.log("SSE streaming error");
    }
  }, []);

  // Update timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const executePlaybookTrigger = useCallback(async (id: string, playDbId: number = 1) => {
    setPlaybookStates((p) => ({ ...p, [id]: "loading" }));
    if (!useMock && selectedThreat) {
        try {
            const rawId = selectedThreat.id.replace('THR-', '');
            await apiExecutePlaybook(playDbId, rawId);
        } catch(err) {
            console.warn("Failed to execute real playbook", err);
        }
    }
    
    setTimeout(() => {
      setPlaybookStates((p) => ({ ...p, [id]: "done" }));
      setTimeout(() => setPlaybookStates((p) => ({ ...p, [id]: "idle" })), 3000);
    }, 2000);
  }, [useMock, selectedThreat]);

  const criticalCount = stats.criticalCount;
  const activeAlerts = stats.activeAlerts;
  const containedCount = stats.containedCount;
  const avgResponse = stats.avgResponse;

  return (
    <div className="space-y-6 fade-in">
      {/* KPI Row (STREAM-style boxes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-surface rounded-xl border border-border/60 p-5 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-accent-red" />
          <p className="font-[var(--font-space-mono)] text-3xl font-bold text-accent-red">{String(criticalCount)}</p>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mt-1">Critical Threats</p>
        </div>
        <div className="relative bg-surface rounded-xl border border-border/60 p-5 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-accent-yellow" />
          <p className="font-[var(--font-space-mono)] text-3xl font-bold text-accent-yellow">{String(activeAlerts)}</p>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mt-1">Active Alerts</p>
        </div>
        <div className="relative bg-surface rounded-xl border border-border/60 p-5 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-accent-blue" />
          <p className="font-[var(--font-space-mono)] text-3xl font-bold text-accent-blue">{String(containedCount)}</p>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mt-1">Threats Contained</p>
        </div>
        <div className="relative bg-surface rounded-xl border border-border/60 p-5 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-accent-green" />
          <p className="font-[var(--font-space-mono)] text-3xl font-bold text-accent-green">{avgResponse}</p>
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mt-1">Avg Response Time</p>
        </div>
      </div>

      {/* STREAM-style dashboard body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: tabbed windows */}
        <div className="xl:col-span-7 space-y-4">
          {/* Tabs */}
          <div className="bg-surface rounded-xl border border-border/60 p-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab("live")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "live" ? "bg-accent-green/10 text-accent-green" : "text-muted hover:text-text hover:bg-surface2"
                }`}
              >
                <Activity className="h-4 w-4" />
                Live Threat Feed
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "analysis" ? "bg-accent-green/10 text-accent-green" : "text-muted hover:text-text hover:bg-surface2"
                }`}
              >
                <Brain className="h-4 w-4" />
                AI Threat Analysis
              </button>
              <button
                onClick={() => setActiveTab("playbooks")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "playbooks" ? "bg-accent-green/10 text-accent-green" : "text-muted hover:text-text hover:bg-surface2"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Response Playbooks
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "live" && (
            <div className="bg-surface rounded-xl border border-border/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                  Live Threat Feed
                </h3>
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse-dot"></div>
              </div>
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
                {threatList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted opacity-50">
                    <Shield className="h-10 w-10 mb-2" />
                    <p>No active threats securely monitored.</p>
                  </div>
                ) : (
                  threatList.slice(0, 10).map((threat) => (
                    <ThreatCard key={threat.id} threat={threat} onClick={() => setSelectedThreat(threat)} />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-lg font-semibold text-text mb-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                AI Threat Analysis
              </h3>
              <p className="text-muted text-sm mb-4">Most recent critical threat analysis</p>
              <div className="bg-surface2 p-4 rounded-xl border border-border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-text">Data Exfiltration Attempt</h4>
                    <p className="text-xs text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                      THR-001
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-accent-red" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                      94%
                    </span>
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
          )}

          {activeTab === "playbooks" && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-lg font-semibold text-text mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Response Playbooks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playbookList.slice(0, 4).map((pb) => {
                  const state = playbookStates[pb.id] || "idle";
                  return (
                    <div key={pb.id} className="bg-surface2 rounded-xl border border-border p-4 hover:border-accent-green/30 transition-all">
                      <div className="text-2xl mb-2">{pb.icon}</div>
                      <h4 className="text-sm font-medium text-text mb-1">{pb.name}</h4>
                      <p className="text-xs text-muted mb-3">{pb.description}</p>
                      <button
                        onClick={() => executePlaybookTrigger(pb.id)}
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
                          <>
                            <div className="w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin-slow"></div> Executing...
                          </>
                        ) : state === "done" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Executed
                          </>
                        ) : (
                          "Execute"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Global Attack Map (split: globe + details) */}
        <div className="xl:col-span-5">
          <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
            <div className="p-5 border-b border-border/60">
              <h3 className="text-lg font-semibold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                Global Attack Map
              </h3>
              <p className="text-xs text-muted mt-1" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                Click a point or arc to inspect details
              </p>
            </div>

            <div className="bg-surface2" style={{ height: 320 }}>
              <AttackGlobe
                attackOrigins={liveOrigins}
                protectedTargets={liveTargets}
                activeThreats={threatList}
                onThreatClick={(threat) => {
                  setSelectedThreat(threat);
                  setMapSelection({ kind: "threat", threat });
                }}
                onLocationClick={(loc) => {
                  setMapSelection({ kind: "location", name: loc.name, locType: loc.type });
                }}
              />
            </div>

            <div className="p-5">
              <div className="flex items-center gap-6 text-xs text-muted mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-red"></div>
                  <span>Attack Origin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-blue"></div>
                  <span>Protected Target</span>
                </div>
              </div>

              <div className="bg-surface2 rounded-xl border border-border p-4">
                {mapSelection.kind === "none" && (
                  <div className="text-sm text-muted">
                    Select an origin/target point to view details here.
                  </div>
                )}

                {mapSelection.kind === "location" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                        {mapSelection.locType}
                      </span>
                      <span className={`text-xs font-semibold ${mapSelection.locType === "Origin" ? "text-accent-red" : "text-accent-blue"}`}>
                        {mapSelection.locType === "Origin" ? "Incoming" : "Protected"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-text break-all" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                      {mapSelection.name}
                    </div>
                    <div className="text-xs text-muted">
                      {mapSelection.locType === "Origin"
                        ? "Source IP observed in recent threat events."
                        : "Target system protected by AEGIS."}
                    </div>
                  </div>
                )}

                {mapSelection.kind === "threat" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                        Threat
                      </span>
                      <span className={`text-xs font-semibold ${severityConfig[mapSelection.threat.severity].color}`}>
                        {mapSelection.threat.severity}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-text">{mapSelection.threat.name}</div>
                    <div className="text-xs text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>
                      {mapSelection.threat.sourceIP} → {mapSelection.threat.targetSystem}
                    </div>
                    <div className="text-xs text-muted">Status: <span className={statusColors[mapSelection.threat.status]}>{mapSelection.threat.status}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Drawer */}
      <ThreatDrawer threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
    </div>
  );
}