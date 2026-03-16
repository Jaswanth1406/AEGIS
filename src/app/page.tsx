"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, Zap, Eye, Brain, ChevronRight, Server, Cpu, Radio, Monitor, Container, Shield, Clock, Bell, AlertTriangle, Lock, Smartphone } from "lucide-react";

// Animated Counter
function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <span className="text-5xl md:text-6xl font-bold gradient-text">{target}{suffix}</span>
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ["problem", "how-it-works", "features", "impact", "technology"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Floating Orbs */}
      <div className="orb orb-green" style={{ width: 600, height: 600, top: -100, right: -200 }} />
      <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: 200, left: -100 }} />
      <div className="orb orb-purple" style={{ width: 500, height: 500, top: '50%', left: '50%' }} />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-surface/90 header-blur border-b border-border shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-text" style={{ fontFamily: "var(--font-syne), sans-serif" }}>AEGIS AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "Features", href: "#features" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Capabilities", href: "#technology" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${activeSection === link.href.slice(1) ? "text-accent-green" : "text-muted hover:text-text"}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-text hover:text-accent-green transition-all">
                Sign In
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-green rounded-full hover:bg-accent-green/90 transition-all shadow-md shadow-accent-green/25">
                Get Started
              </Link>
            </div>
            <button className="md:hidden text-text" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface/95 header-blur border-b border-border animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              {["Features", "How It Works", "Capabilities", "Impact"].map((label) => (
                <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`} className="block text-muted hover:text-accent-green py-2" onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Link href="/login" className="flex-1 text-center px-4 py-2 text-sm text-text border border-border rounded-full">Sign In</Link>
                <Link href="/register" className="flex-1 text-center px-4 py-2 text-sm text-white bg-accent-green rounded-full">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden grid-bg">
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-green/30 bg-accent-green/5 text-accent-green text-sm mb-8 fade-in">
            <div className="w-2 h-2 rounded-full bg-accent-green pulse-live" />
            <span className="font-semibold tracking-wider uppercase" style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "11px" }}>Autonomous Cyber-Immune Platform</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-text leading-tight mb-6 fade-in" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            <span className="gradient-text">AEGIS AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-4 fade-in fade-in-delay-1" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Your Network&apos;s Digital Immune System
          </p>
          <p className="text-sm md:text-base text-muted max-w-2xl mx-auto mb-10 fade-in fade-in-delay-2">
            AEGIS AI learns what normal looks like in your network, detects anything that isn&apos;t — and neutralizes threats automatically before a human even has to react.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-in fade-in-delay-3">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-accent-green rounded-full hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/25">
              <Shield className="h-4 w-4" />
              Create Account →
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-text border border-border rounded-full hover:border-accent-green/30 hover:bg-surface transition-all">
              <Lock className="h-4 w-4" />
              Sign In to Platform
            </Link>
          </div>
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-16 fade-in fade-in-delay-3">
            {[
              { icon: <Zap className="h-4 w-4 text-accent-green" />, text: "<1ms Response Time" },
              { icon: <Shield className="h-4 w-4 text-accent-green" />, text: "95% False Positive Reduction" },
              { icon: <Eye className="h-4 w-4 text-accent-green" />, text: "24/7 Monitoring" },
            ].map((stat) => (
              <div key={stat.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm">
                {stat.icon}
                <span className="text-text">{stat.text}</span>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-4xl mx-auto fade-in fade-in-delay-4">
            <div className="bg-surface rounded-2xl border border-border shadow-xl p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent-red"></div>
                <div className="w-3 h-3 rounded-full bg-accent-yellow"></div>
                <div className="w-3 h-3 rounded-full bg-accent-green"></div>
                <span className="text-muted text-xs ml-2" style={{ fontFamily: "var(--font-space-mono), monospace" }}>AEGIS Dashboard — Live</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-surface2 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-accent-red" style={{ fontFamily: "var(--font-space-mono), monospace" }}>3</div>
                  <div className="text-xs text-muted">Critical</div>
                </div>
                <div className="bg-surface2 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-accent-yellow" style={{ fontFamily: "var(--font-space-mono), monospace" }}>12</div>
                  <div className="text-xs text-muted">Alerts</div>
                </div>
                <div className="bg-surface2 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-accent-green" style={{ fontFamily: "var(--font-space-mono), monospace" }}>847</div>
                  <div className="text-xs text-muted">Contained</div>
                </div>
                <div className="bg-surface2 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-accent-blue" style={{ fontFamily: "var(--font-space-mono), monospace" }}>&lt;1ms</div>
                  <div className="text-xs text-muted">Response</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Data Exfiltration", severity: "CRITICAL", time: "2s ago" },
                  { name: "Brute Force Attack", severity: "HIGH", time: "15s ago" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between bg-surface2 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${t.severity === "CRITICAL" ? "text-accent-red" : "text-accent-yellow"}`} />
                      <span className="text-sm text-text">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${t.severity === "CRITICAL" ? "bg-accent-red/10 text-accent-red" : "bg-accent-yellow/10 text-accent-yellow"}`}>{t.severity}</span>
                      <span className="text-xs text-muted">{t.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating alert card */}
            <div className="absolute -right-4 top-20 bg-surface p-3 rounded-xl border border-border shadow-lg float hidden lg:block">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse-glow"></div>
                <span className="text-xs text-accent-red font-medium">CRITICAL ALERT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>THE PROBLEM</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Traditional Security Can&apos;t Keep Up</h2>
            <p className="text-muted max-w-2xl mx-auto">Threats evolve faster than signature-based defenses. Your team is drowning in alerts while real attacks slip through.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <AlertTriangle className="h-6 w-6" />, title: "Evolution Outpaces Defense", description: "Threats evolve faster than signature-based defenses, leaving gaps for new attack techniques." },
              { icon: <Shield className="h-6 w-6" />, title: "Zero-Day Vulnerabilities", description: "Unknown exploits bypass static rules and signature lists." },
              { icon: <Bell className="h-6 w-6" />, title: "Alert Fatigue", description: "Noisy alerts and manual triage overwhelm teams, increasing missed threats." },
              { icon: <Clock className="h-6 w-6" />, title: "Slow Mitigation", description: "Manual response workflows delay containment, widening impact." },
            ].map((card) => (
              <div key={card.title} className="bg-bg p-6 rounded-xl border-l-4 border-l-accent-red/50 border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green mb-4 group-hover:bg-accent-green/20 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{card.title}</h3>
                <p className="text-muted text-sm">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-bg grid-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Like a Human Immune System, For Your Network</h2>
            <p className="text-muted max-w-2xl mx-auto">AEGIS learns your normal. Spots the abnormal. Responds instantly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: <Eye className="h-8 w-8" />, step: "Step 1", title: "MONITOR", description: "Continuously baseline users, devices and network traffic 24/7 to detect deviations" },
              { icon: <Brain className="h-8 w-8" />, step: "Step 2", title: "DETECT", description: "AI compares behavior against learned patterns to flag anomalies instantly with minimal false positives" },
              { icon: <Zap className="h-8 w-8" />, step: "Step 3", title: "RESPOND", description: "Automated playbooks neutralize threats in milliseconds — observe, isolate, remediate, validate" },
            ].map((step, i) => (
              <div key={step.title} className="relative text-center group">
                <div className="w-20 h-20 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green mx-auto mb-6 group-hover:bg-accent-green/20 group-hover:shadow-lg group-hover:shadow-accent-green/10 transition-all">
                  {step.icon}
                </div>
                <span className="text-xs text-accent-green font-medium tracking-wider" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{step.step}</span>
                <h3 className="text-xl font-bold text-text mt-2 mb-3" style={{ fontFamily: "var(--font-syne), sans-serif" }}>{step.title}</h3>
                <p className="text-muted text-sm">{step.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-border">
                    <ChevronRight className="h-8 w-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Timeline */}
          <div className="relative">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {["Attack occurs", "AEGIS detects in <1s", "Playbook executes", "Threat contained", "Report generated"].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-4 h-4 rounded-full ${i <= 3 ? "bg-accent-green shadow-lg shadow-accent-green/30" : "bg-border"} transition-all duration-500`}></div>
                  <span className="text-xs text-muted text-center max-w-[80px]">{label}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-2 left-[10%] right-[10%] h-0.5 bg-border">
              <div className="h-full bg-gradient-to-r from-accent-green to-accent-blue w-4/5 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Key Innovations */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>KEY INNOVATIONS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Four Technologies That Set AEGIS Apart</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🧬", title: "Threat DNA Fingerprinting", description: "Converts attacks into behavioral \"DNA\" vectors across network, endpoint, and user telemetry. Detects mutated threats by matching behavior — not static signatures." },
              { icon: "🪤", title: "Adaptive Honeytokens", description: "Context-aware decoy credentials, files, and endpoints that evolve with your environment. Any access to decoys immediately signals compromise with near-zero false positives." },
              { icon: "🤖", title: "Autonomous Defense Playbooks", description: "AI-ranked playbooks that automatically observe, isolate, remediate, and validate — with human override and full audit logs for compliance." },
              { icon: "🧠", title: "Explainable AI", description: "Clear threat rationales showing features, evidence chains, and confidence scores. Analysts understand exactly why each alert was raised." },
            ].map((feature) => (
              <div key={feature.title} className="bg-bg p-6 rounded-xl border border-border border-t-2 border-t-accent-green hover:scale-[1.02] hover:shadow-lg hover:border-accent-green/50 transition-all duration-300 group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-text mb-3">{feature.title}</h3>
                <p className="text-muted text-sm mb-4">{feature.description}</p>
                <span className="text-accent-green text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                  Learn More <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="impact" className="py-24 bg-bg grid-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>TANGIBLE IMPACT</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Numbers That Speak for Themselves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { value: "<1s", label: "Mean Time To Detect", sub: "From hours to seconds" },
              { value: "95%", label: "False Positive Reduction", sub: "Via behavioral AI models" },
              { value: "24/7", label: "Continuous Monitoring", sub: "Zero gaps, zero downtime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-surface p-8 rounded-2xl border border-border glow-green">
                <AnimatedCounter target={stat.value} />
                <h3 className="text-lg font-semibold text-text mt-4 mb-2">{stat.label}</h3>
                <p className="text-muted text-sm">{stat.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-muted">Result: lower breach costs, better efficiency, and stronger security posture.</p>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="technology" className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>BUILT WITH</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Enterprise-Grade Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <Server className="h-8 w-8" />, name: "Backend", tools: "Python + FastAPI", desc: "High-performance async APIs" },
              { icon: <Cpu className="h-8 w-8" />, name: "Machine Learning", tools: "Scikit-Learn", desc: "XGBoost, Isolation Forest, SHAP" },
              { icon: <Radio className="h-8 w-8" />, name: "Streaming", tools: "Redis Streams", desc: "Real-time ingestion and processing" },
              { icon: <Monitor className="h-8 w-8" />, name: "Frontend", tools: "Next.js + React", desc: "Interactive dashboards" },
              { icon: <Container className="h-8 w-8" />, name: "Infrastructure", tools: "Docker", desc: "Containerized deployments" },
              { icon: <Smartphone className="h-8 w-8" />, name: "Mobile", tools: "Java + Kotlin", desc: "Mobile application" },
            ].map((tech) => (
              <div key={tech.name} className="bg-bg p-5 rounded-xl border border-border text-center hover:border-accent-green/30 transition-all group">
                <div className="text-accent-green mb-3 flex justify-center group-hover:scale-110 transition-transform">{tech.icon}</div>
                <h3 className="text-sm font-semibold text-text mb-1">{tech.name}</h3>
                <p className="text-accent-green text-xs mb-1" style={{ fontFamily: "var(--font-space-mono), monospace" }}>{tech.tools}</p>
                <p className="text-muted text-xs">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Enhancements */}
      <section className="py-24 bg-bg grid-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-accent-green text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-space-mono), monospace" }}>ROADMAP</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text mt-4 mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Future Enhancements</h2>
            <p className="text-muted max-w-2xl mx-auto">AEGIS is evolving — next-generation capabilities to outpace sophisticated threats.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🌐", title: "Dark Web Intelligence", desc: "Proactively monitor dark web sources to spot emerging threats and leaked credentials." },
              { icon: "🤝", title: "Federated Threat Learning", desc: "Share anonymized threat signals across partners to improve global detection." },
              { icon: "🎯", title: "AI-Driven Simulations", desc: "Run adaptive AI attack simulations to test and strengthen defenses." },
              { icon: "♻️", title: "Self-Healing Infrastructure", desc: "Automate remediation so systems recover integrity with minimal human input." },
            ].map((item) => (
              <div key={item.title} className="bg-surface p-6 rounded-xl border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-semibold text-text mb-2">{item.title}</h3>
                <p className="text-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-accent-green/5 to-bg">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>Ready to Protect Your Network?</h2>
          <p className="text-muted mb-10">Join AEGIS AI and turn your security from a cost center into a strategic advantage.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register" className="px-8 py-3.5 text-base font-semibold bg-accent-green text-white rounded-full hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/25">
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-3.5 text-base font-semibold text-text border border-border rounded-full hover:border-accent-green/30 transition-all">
              Sign In
            </Link>
          </div>
          <p className="text-muted text-sm">No credit card required  •  Setup in minutes  •  Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-accent-green flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-text">AEGIS AI</span>
              </div>
              <p className="text-muted text-sm">Autonomous Cyber-Immune Platform</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-3">Product</h4>
              <div className="space-y-2">
                {["Features", "How It Works", "Technology"].map((l) => (
                  <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="block text-sm text-muted hover:text-accent-green transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-3">Company</h4>
              <div className="space-y-2">
                {["About", "Blog", "Careers"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-muted hover:text-accent-green transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text mb-3">Legal</h4>
              <div className="space-y-2">
                {["Privacy", "Terms", "Security"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-muted hover:text-accent-green transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted text-sm">© 2026 AEGIS AI. Built by Algorithm Avengers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
