"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Loader2, ShieldAlert, Power, Copy } from "lucide-react";
import {
  createHoneytoken,
  deactivateHoneytoken,
  fetchHoneytokens,
  type Honeytoken,
} from "@/lib/api-client";

type TokenType = "credential" | "api_key" | "database_record" | "file" | "url";

const TOKEN_TYPES: TokenType[] = ["credential", "api_key", "database_record", "file", "url"];

const statusStyles: Record<string, string> = {
  active: "bg-accent-green/10 text-accent-green border-accent-green/30",
  triggered: "bg-accent-red/10 text-accent-red border-accent-red/30",
  deactivated: "bg-surface2 text-muted border-border",
};

function formatDateTime(v: string | null) {
  if (!v) return "-";
  const d = new Date(v.endsWith("Z") || v.includes("+") ? v : `${v}Z`);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HoneytokensPage() {
  const [tokens, setTokens] = useState<Honeytoken[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "triggered" | "deactivated">("all");

  const [form, setForm] = useState({
    name: "",
    token_type: "credential" as TokenType,
    token_value: "",
    deployed_location: "",
  });

  const loadHoneytokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchHoneytokens();
      setTokens(items);
    } catch (e) {
      console.error(e);
      setError("Could not load honeytokens from platform API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHoneytokens();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return tokens;
    return tokens.filter((t) => t.status === filter);
  }, [tokens, filter]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.deployed_location.trim()) {
      setError("Name and deployed location are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createHoneytoken({
        name: form.name.trim(),
        token_type: form.token_type,
        token_value: form.token_value.trim() || undefined,
        deployed_location: form.deployed_location.trim(),
      });
      setForm({ name: "", token_type: "credential", token_value: "", deployed_location: "" });
      await loadHoneytokens();
    } catch (e) {
      console.error(e);
      setError("Failed to create honeytoken.");
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async (id: number) => {
    try {
      setActioningId(id);
      setError(null);
      await deactivateHoneytoken(id);
      await loadHoneytokens();
    } catch (e) {
      console.error(e);
      setError("Failed to deactivate honeytoken.");
    } finally {
      setActioningId(null);
    }
  };

  const copyToken = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Honeytokens</h1>
          <p className="text-muted text-sm mt-1">Deploy decoy assets and detect high-confidence compromise instantly.</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Triggered token = CRITICAL threat
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-accent-green" />
            Create Honeytoken
          </h2>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="text-xs text-muted mb-1 block">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-green"
                placeholder="Backup Admin Creds"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Type</label>
              <select
                value={form.token_type}
                onChange={(e) => setForm((p) => ({ ...p, token_type: e.target.value as TokenType }))}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-green"
              >
                {TOKEN_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Value (optional)</label>
              <input
                value={form.token_value}
                onChange={(e) => setForm((p) => ({ ...p, token_value: e.target.value }))}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-green"
                placeholder="service_recovery:Tmp!9x2k"
              />
              <p className="text-[11px] text-muted mt-1">Leave empty to auto-generate on backend.</p>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Deployed Location</label>
              <input
                value={form.deployed_location}
                onChange={(e) => setForm((p) => ({ ...p, deployed_location: e.target.value }))}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-green"
                placeholder="config/secrets.yml"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-accent-green/10 border border-accent-green/30 text-accent-green text-sm font-semibold hover:bg-accent-green/20 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {saving ? "Creating..." : "Create Honeytoken"}
            </button>
          </form>
        </div>

        <div className="xl:col-span-3 bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-text">Deployed Honeytokens</h2>
            <div className="flex items-center gap-2">
              {(["all", "active", "triggered", "deactivated"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    filter === s
                      ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
                      : "bg-surface2 border-border text-muted hover:text-text"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent-green mx-auto mb-2" />
              <p className="text-xs text-muted">Loading honeytokens...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-surface2 border-b border-border">
                    {[
                      "Name",
                      "Type",
                      "Location",
                      "Status",
                      "Created",
                      "Triggered",
                      "Actions",
                    ].map((h) => (
                      <th key={h} className="text-left text-xs text-muted font-semibold px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                        No honeytokens found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="border-b border-border/40 hover:bg-surface2/40 transition-colors">
                        <td className="px-4 py-3 text-sm text-text font-medium">{t.name}</td>
                        <td className="px-4 py-3 text-xs text-muted font-mono">{t.token_type}</td>
                        <td className="px-4 py-3 text-sm text-muted">{t.deployed_location}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${(statusStyles[t.status] || statusStyles.active)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{formatDateTime(t.created_at)}</td>
                        <td className="px-4 py-3 text-xs text-muted">{formatDateTime(t.triggered_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToken(t.token_value)}
                              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
                              title="Copy token value"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeactivate(t.id)}
                              disabled={t.status !== "active" || actioningId === t.id}
                              className="p-1.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Deactivate"
                            >
                              {actioningId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
