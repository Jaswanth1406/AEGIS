"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Sparkles,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  ChevronDown,
} from "lucide-react";

const FRAMEWORKS = [
  {
    id: "DPDP 2023",
    name: "DPDP 2023",
    full: "Digital Personal Data Protection Act",
    flag: "🇮🇳",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
  {
    id: "CERT-In",
    name: "CERT-In 2022",
    full: "Cyber Security Directions",
    flag: "🛡️",
    color: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/30",
  },
  {
    id: "RBI",
    name: "RBI Cyber",
    full: "Cyber Security Framework for Banks",
    flag: "🏦",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
  {
    id: "IT Act",
    name: "IT Act 2000",
    full: "Information Technology Act",
    flag: "⚖️",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
  {
    id: "MeitY",
    name: "MeitY",
    full: "National Cyber Security Policy",
    flag: "🏛️",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/30",
  },
];

const DATE_RANGES = [
  "Last 30 days",
  "Last 90 days",
  "Last 6 months",
  "Last 12 months",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
];

interface ReportData {
  framework: string;
  orgName: string;
  dateRange: string;
  narrative: string;
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    mitigated: number;
    investigating: number;
    threatTypes: string[];
  };
  generatedAt: string;
}

export default function CompliancePage() {
  const [selectedFramework, setSelectedFramework] = useState("DPDP 2023");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fw = FRAMEWORKS.find((f) => f.id === selectedFramework)!;

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/compliance/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework: selectedFramework, dateRange, orgName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [30, 30, 30]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentW);
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.45;
      });
      y += 2;
    };

    const addDivider = () => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    };

    // ── Header ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("AEGIS AI", margin, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Automated Security Intelligence Platform", margin, 26);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${report.framework} Compliance Report`, margin, 35);
    y = 52;

    // ── Meta ──
    addText(`Organisation: ${report.orgName}`, 10, "normal", [80, 80, 80]);
    addText(`Reporting Period: ${report.dateRange}`, 10, "normal", [80, 80, 80]);
    addText(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 10, "normal", [80, 80, 80]);
    addText(`Report Classification: CONFIDENTIAL`, 10, "bold", [180, 30, 30]);
    y += 4;
    addDivider();

    // ── Stats ──
    addText("EXECUTIVE SECURITY METRICS", 12, "bold", [30, 30, 30]);
    y += 2;
    const stats = [
      ["Total Events Detected", String(report.stats.total)],
      ["Critical Severity", String(report.stats.critical)],
      ["High Severity", String(report.stats.high)],
      ["Mitigated / Resolved", String(report.stats.mitigated)],
      ["Data Breach Confirmed", "NO ✓"],
    ];
    stats.forEach(([label, val]) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(val, margin + 90, y);
      y += 7;
    });
    y += 4;
    addDivider();

    // ── Narrative ──
    addText("COMPLIANCE ASSESSMENT", 12, "bold", [30, 30, 30]);
    y += 2;
    const sections = report.narrative.split(/\n(?=#+\s|\*\*[A-Z])/);
    sections.forEach((section) => {
      const clean = section.replace(/#{1,4}\s/g, "").replace(/\*\*/g, "").trim();
      if (!clean) return;
      const lines = clean.split("\n");
      lines.forEach((line, i) => {
        if (i === 0 && line.length < 80) {
          addText(line, 11, "bold", [30, 30, 30]);
        } else {
          addText(line, 9.5, "normal", [60, 60, 60]);
        }
      });
      y += 3;
    });

    addDivider();
    addText("This report was automatically generated by AEGIS AI using live threat intelligence data.", 8, "normal", [130, 130, 130]);
    addText("For audit purposes, retain alongside your AEGIS threat log export.", 8, "normal", [130, 130, 130]);

    const filename = `AEGIS_${report.framework.replace(/\s/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Compliance Reports
          </h1>
          <p className="text-muted text-sm mt-1">
            One-click audit-ready reports — DPDP, CERT-In, RBI, IT Act, MeitY
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/30">
          <Sparkles className="w-3.5 h-3.5 text-accent-green" />
          <span className="text-xs font-semibold text-accent-green">Powered by Groq AI</span>
        </div>
      </div>

      {/* Framework Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FRAMEWORKS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFramework(f.id)}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              selectedFramework === f.id
                ? `${f.bg} ${f.border} border`
                : "bg-surface border-border hover:bg-surface2"
            }`}
          >
            {selectedFramework === f.id && (
              <CheckCircle className={`absolute top-3 right-3 h-4 w-4 ${f.color}`} />
            )}
            <div className="text-2xl mb-2">{f.flag}</div>
            <div className={`text-sm font-bold ${selectedFramework === f.id ? f.color : "text-text"}`}>
              {f.name}
            </div>
            <div className="text-[10px] text-muted mt-0.5 leading-tight">{f.full}</div>
          </button>
        ))}
      </div>

      {/* Config */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted" />
          Report Configuration
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Organisation Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp Ltd."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted outline-none focus:border-accent-green transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Reporting Period</label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent-green appearance-none transition-colors"
              >
                {DATE_RANGES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-green text-white font-semibold text-sm hover:bg-accent-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating {selectedFramework} Report...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {selectedFramework} Compliance Report
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-accent-red/10 border border-accent-red/30 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-accent-red">Generation Failed</p>
            <p className="text-xs text-muted mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Report */}
      {report && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Report header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${fw.bg}`}>
                <FileText className={`h-4 w-4 ${fw.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-text">{report.framework} Compliance Report</p>
                <p className="text-xs text-muted">{report.orgName} · {report.dateRange}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/30">
                <Shield className="h-3 w-3 text-accent-green" />
                <span className="text-[10px] font-semibold text-accent-green uppercase tracking-wide">
                  AI Generated
                </span>
              </div>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green text-white text-xs font-semibold hover:bg-accent-green/90 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border">
            {[
              { label: "Total Events", value: report.stats.total, icon: AlertTriangle, color: "text-text" },
              { label: "Critical", value: report.stats.critical, icon: AlertTriangle, color: "text-accent-red" },
              { label: "High", value: report.stats.high, icon: AlertTriangle, color: "text-orange-400" },
              { label: "Mitigated", value: report.stats.mitigated, icon: CheckCircle, color: "text-accent-green" },
              { label: "No Breach", value: "✓", icon: Shield, color: "text-accent-green" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface px-4 py-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div ref={reportRef} className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              {report.narrative.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />;
                if (line.startsWith("## ") || line.startsWith("# ")) {
                  return (
                    <h3 key={i} className="text-base font-bold text-text mt-5 mb-2">
                      {line.replace(/^#+\s/, "")}
                    </h3>
                  );
                }
                if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <p key={i} className="text-sm font-semibold text-text mt-3 mb-1">
                      {line.slice(2, -2)}
                    </p>
                  );
                }
                if (line.startsWith("- ") || line.startsWith("• ")) {
                  return (
                    <div key={i} className="flex gap-2 text-sm text-muted mb-1 pl-2">
                      <span className="text-accent-green mt-1 shrink-0">•</span>
                      <span>{line.replace(/^[-•]\s/, "")}</span>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm text-muted leading-relaxed mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-surface2 flex items-center justify-between">
            <p className="text-[10px] text-muted">
              This report was auto-generated by AEGIS AI using live threat intelligence data.
              For audit purposes, retain alongside your AEGIS threat log export.
            </p>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-green text-white text-xs font-semibold hover:bg-accent-green/90 transition-all whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
