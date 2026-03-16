"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Play, AlertTriangle, X } from "lucide-react";
import { threats as allThreats, type Threat } from "@/lib/mock-data";

const severityConfig = {
  CRITICAL: { color: "text-accent-red", bg: "bg-accent-red/10", rowBg: "bg-accent-red/[0.03]" },
  HIGH: { color: "text-orange-500", bg: "bg-orange-500/10", rowBg: "bg-orange-500/[0.03]" },
  MEDIUM: { color: "text-accent-yellow", bg: "bg-accent-yellow/10", rowBg: "bg-accent-yellow/[0.03]" },
  LOW: { color: "text-accent-green", bg: "bg-accent-green/10", rowBg: "bg-accent-green/[0.03]" },
};

const statusColors: Record<string, string> = {
  Investigating: "text-accent-yellow",
  Contained: "text-accent-blue",
  Blocked: "text-accent-green",
  Active: "text-accent-red",
};

function formatTime(date: Date) {
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ThreatsPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);
  const perPage = 8;

  const filtered = useMemo(() => {
    return allThreats.filter((t) => {
      const matchesSeverity = severityFilter === "All" || t.severity === severityFilter;
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.sourceIP.includes(search) || t.targetSystem.toLowerCase().includes(search.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [search, severityFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const executePlaybook = (threatId: string) => {
    setExecutingPlaybook(threatId);
    setTimeout(() => setExecutingPlaybook(null), 2000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Threat Management</h1>
          <p className="text-muted text-sm mt-1">{allThreats.length} threats detected · {allThreats.filter((t) => t.severity === "CRITICAL").length} critical</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-surface rounded-xl border border-border p-1">
          {["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => { setSeverityFilter(sev); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                severityFilter === sev ? "bg-accent-green/10 text-accent-green" : "text-muted hover:text-text"
              }`}
            >
              {sev === "All" ? "All" : sev.charAt(0) + sev.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface flex-1 max-w-sm focus-within:border-accent-green transition-colors">
          <Search className="h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, IP, or target..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-text placeholder-muted outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {["ID", "Threat Type", "Severity", "Source IP", "Target", "Time", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((threat) => {
                const config = severityConfig[threat.severity];
                return (
                  <tr key={threat.id} className={`border-b border-border/50 ${config.rowBg} hover:bg-surface2/50 transition-colors`}>
                    <td className="px-4 py-3 text-sm text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{threat.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text">{threat.name}</p>
                        <p className="text-xs text-muted">{threat.type}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.bg} ${config.color}`}>{threat.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{threat.sourceIP}</td>
                    <td className="px-4 py-3 text-sm text-muted">{threat.targetSystem}</td>
                    <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatTime(threat.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${statusColors[threat.status]}`}>{threat.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedThreat(threat)} className="p-1.5 rounded-lg text-muted hover:text-accent-green hover:bg-accent-green/10 transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => executePlaybook(threat.id)}
                          disabled={executingPlaybook === threat.id}
                          className="p-1.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
                          title="Execute Playbook"
                        >
                          {executingPlaybook === threat.id ? (
                            <div className="w-4 h-4 border-2 border-accent-red border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-muted text-sm">No threats found matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-muted hover:text-accent-green disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === p ? "bg-accent-green/10 text-accent-green" : "text-muted hover:text-text"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-muted hover:text-accent-green disabled:opacity-30 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedThreat(null)} />
          <div className="relative bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 fade-in shadow-xl">
            <button onClick={() => setSelectedThreat(null)} className="absolute top-4 right-4 text-muted hover:text-text">
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-4">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${severityConfig[selectedThreat.severity].bg} ${severityConfig[selectedThreat.severity].color}`}>{selectedThreat.severity}</span>
                <h2 className="text-xl font-bold text-text mt-2">{selectedThreat.name}</h2>
                <p className="text-muted text-sm" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{selectedThreat.id} · {selectedThreat.type}</p>
              </div>
              <p className="text-muted text-sm">{selectedThreat.description}</p>
              <div className="bg-surface2 p-4 rounded-xl border border-border space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Source IP</span><span className="text-text" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{selectedThreat.sourceIP}</span></div>
                <div className="flex justify-between"><span className="text-muted">Target</span><span className="text-text">{selectedThreat.targetSystem}</span></div>
                <div className="flex justify-between"><span className="text-muted">Attack Vector</span><span className="text-accent-green">{selectedThreat.details.attackVector}</span></div>
                <div className="flex justify-between"><span className="text-muted">Status</span><span className={statusColors[selectedThreat.status]}>{selectedThreat.status}</span></div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text mb-2">Indicators</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedThreat.details.indicators.map((ind) => (
                    <span key={ind} className="text-xs px-2 py-1 rounded-lg bg-surface2 border border-border text-muted">{ind}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text mb-2">Recommended Action</h4>
                <p className="text-muted text-sm">{selectedThreat.details.recommendedAction}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
