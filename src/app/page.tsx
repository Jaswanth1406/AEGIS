"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Menu, X, Zap, Eye, Brain, Bot, Lock, Clock, AlertTriangle, Bell, ChevronRight, Server, Cpu, Radio, Monitor, Container } from "lucide-react";

// Deterministic particle positions to avoid hydration mismatch
const particlePositions = Array.from({ length: 30 }, (_, i) => ({
  left: ((i * 37 + 13) % 100),
  duration: 8 + ((i * 7 + 3) % 12),
  delay: ((i * 5 + 2) % 8),
  size: 1 + ((i * 3) % 3),
}));

// Particle Background Component
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particlePositions.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
      {/* Circuit Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 0 50 L 40 50 L 50 40 L 60 50 L 100 50" stroke="#00d4ff" fill="none" strokeWidth="0.5" />
            <path d="M 50 0 L 50 40 M 50 60 L 50 100" stroke="#00d4ff" fill="none" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="2" fill="#00d4ff" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  );
}

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
      <span className="text-5xl md:text-6xl font-bold text-gradient-teal">{target}{suffix}</span>
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
    <div className="min-h-screen bg-navy">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-navy/90 backdrop-blur-xl border-b border-border shadow-lg shadow-navy/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-teal" />
              <span className="text-xl font-bold text-white">AEGIS AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Technology", href: "#technology" },
                { label: "Impact", href: "#impact" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${activeSection === link.href.slice(1) ? "text-teal" : "text-text-muted hover:text-text-primary"}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/10 transition-all">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal/80 transition-all shadow-lg shadow-teal/25">
                Get Started
              </Link>
            </div>
            <button className="md:hidden text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              {["Features", "How It Works", "Technology", "Impact"].map((label) => (
                <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`} className="block text-text-muted hover:text-teal py-2" onClick={() => setMobileMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Link href="/login" className="flex-1 text-center px-4 py-2 text-sm text-teal border border-teal/30 rounded-lg">Login</Link>
                <Link href="/register" className="flex-1 text-center px-4 py-2 text-sm text-white bg-teal rounded-lg">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal/30 bg-teal/5 text-teal text-sm mb-8 animate-fade-in">
            <Zap className="h-4 w-4" />
            <span>Powered by AI</span>
            <span className="text-text-muted">•</span>
            <span>Real-time Protection</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in-up">
            Your Network&apos;s<br />
            <span className="text-gradient-teal">Autonomous Immune System</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            AEGIS AI learns what normal looks like in your network,
            detects anything that isn&apos;t — and neutralizes threats
            automatically before a human even has to react.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Link href="/register" className="px-8 py-3.5 text-base font-semibold text-white bg-teal rounded-xl hover:bg-teal/80 transition-all shadow-lg shadow-teal/30 hover:shadow-teal/50">
              Get Started Free
            </Link>
            <a href="#how-it-works" className="px-8 py-3.5 text-base font-semibold text-teal border border-teal/30 rounded-xl hover:bg-teal/10 transition-all">
              See How It Works
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-16 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            {[
              { icon: <Zap className="h-4 w-4 text-teal" />, text: "<1ms Response Time" },
              { icon: <Shield className="h-4 w-4 text-teal" />, text: "95% False Positive Reduction" },
              { icon: <Eye className="h-4 w-4 text-teal" />, text: "24/7 Monitoring" },
            ].map((stat) => (
              <div key={stat.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border text-sm">
                {stat.icon}
                <span className="text-text-primary">{stat.text}</span>
              </div>
            ))}
          </div>
          {/* Dashboard Preview */}
          <div className="relative max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-critical"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-safe"></div>
                <span className="text-text-muted text-xs ml-2">AEGIS Dashboard — Live</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-navy/80 rounded-lg p-3 border border-border">
                  <div className="text-lg font-bold text-critical">3</div>
                  <div className="text-xs text-text-muted">Critical</div>
                </div>
                <div className="bg-navy/80 rounded-lg p-3 border border-border">
                  <div className="text-lg font-bold text-warning">12</div>
                  <div className="text-xs text-text-muted">Alerts</div>
                </div>
                <div className="bg-navy/80 rounded-lg p-3 border border-border">
                  <div className="text-lg font-bold text-safe">847</div>
                  <div className="text-xs text-text-muted">Contained</div>
                </div>
                <div className="bg-navy/80 rounded-lg p-3 border border-border">
                  <div className="text-lg font-bold text-teal">&lt;1ms</div>
                  <div className="text-xs text-text-muted">Response</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Data Exfiltration", severity: "CRITICAL", time: "2s ago" },
                  { name: "Brute Force Attack", severity: "HIGH", time: "15s ago" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between bg-navy/60 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${t.severity === "CRITICAL" ? "text-critical" : "text-warning"}`} />
                      <span className="text-sm text-text-primary">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${t.severity === "CRITICAL" ? "bg-critical/20 text-critical" : "bg-warning/20 text-warning"}`}>{t.severity}</span>
                      <span className="text-xs text-text-muted">{t.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating alert card */}
            <div className="absolute -right-4 top-20 glass-card p-3 rounded-xl animate-float shadow-lg shadow-critical/20 hidden lg:block">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-critical animate-pulse-glow"></div>
                <span className="text-xs text-critical font-medium">CRITICAL ALERT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">THE PROBLEM</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Traditional Security Can&apos;t Keep Up</h2>
            <p className="text-text-muted max-w-2xl mx-auto">Threats evolve faster than signature-based defenses. Your team is drowning in alerts while real attacks slip through.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <AlertTriangle className="h-6 w-6" />, title: "Evolution Outpaces Defense", description: "Threats evolve faster than signature-based defenses, leaving gaps for new attack techniques." },
              { icon: <Shield className="h-6 w-6" />, title: "Zero-Day Vulnerabilities", description: "Unknown exploits bypass static rules and signature lists." },
              { icon: <Bell className="h-6 w-6" />, title: "Alert Fatigue", description: "Noisy alerts and manual triage overwhelm teams, increasing missed threats." },
              { icon: <Clock className="h-6 w-6" />, title: "Slow Mitigation", description: "Manual response workflows delay containment, widening impact." },
            ].map((card) => (
              <div key={card.title} className="bg-navy p-6 rounded-xl border-l-4 border-l-critical/50 border border-border hover:shadow-lg hover:shadow-critical/10 hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-4 group-hover:bg-teal/20 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-text-muted text-sm">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Like a Human Immune System, For Your Network</h2>
            <p className="text-text-muted max-w-2xl mx-auto">AEGIS learns your normal. Spots the abnormal. Responds instantly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: <Eye className="h-8 w-8" />, step: "Step 1", title: "MONITOR", description: "Continuously baseline users, devices and network traffic 24/7" },
              { icon: <Brain className="h-8 w-8" />, step: "Step 2", title: "DETECT", description: "AI compares behavior against learned patterns to flag anomalies instantly" },
              { icon: <Zap className="h-8 w-8" />, step: "Step 3", title: "RESPOND", description: "Automated playbooks neutralize threats in milliseconds automatically" },
            ].map((step, i) => (
              <div key={step.title} className="relative text-center group">
                <div className="w-20 h-20 rounded-2xl bg-teal/10 flex items-center justify-center text-teal mx-auto mb-6 group-hover:bg-teal/20 group-hover:shadow-lg group-hover:shadow-teal/20 transition-all">
                  {step.icon}
                </div>
                <span className="text-xs text-teal font-medium tracking-wider">{step.step}</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-3">{step.title}</h3>
                <p className="text-text-muted text-sm">{step.description}</p>
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
                  <div className={`w-4 h-4 rounded-full ${i <= 3 ? "bg-teal shadow-lg shadow-teal/50" : "bg-border"} transition-all duration-500`} style={{ animationDelay: `${i * 0.3}s` }}></div>
                  <span className="text-xs text-text-muted text-center max-w-[80px]">{label}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-2 left-[10%] right-[10%] h-0.5 bg-border">
              <div className="h-full bg-gradient-to-r from-teal to-safe w-4/5 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">KEY INNOVATIONS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Four Technologies That Set AEGIS Apart</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "🧬", title: "Threat DNA Fingerprinting", description: "Converts attacks into behavioral \"DNA\" vectors across network, endpoint, and user telemetry. Detects mutated threats by matching behavior — not static signatures." },
              { icon: "🪤", title: "Adaptive Honeytokens", description: "Context-aware decoy credentials, files, and endpoints that evolve with your environment. Any access to decoys immediately signals compromise with near-zero false positives." },
              { icon: "🤖", title: "Autonomous Defense Playbooks", description: "AI-ranked playbooks that automatically observe, isolate, remediate, and validate — with human override and full audit logs for compliance." },
              { icon: "🧠", title: "Explainable AI", description: "Clear threat rationales showing features, evidence chains, and confidence scores. Analysts understand exactly why each alert was raised." },
            ].map((feature) => (
              <div key={feature.title} className="bg-navy p-6 rounded-xl border border-border border-t-2 border-t-teal hover:scale-[1.02] hover:shadow-lg hover:shadow-teal/10 hover:border-teal/50 transition-all duration-300 group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-text-muted text-sm mb-4">{feature.description}</p>
                <span className="text-teal text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                  Learn More <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="impact" className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">TANGIBLE IMPACT</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Numbers That Speak for Themselves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { value: "<1s", label: "Mean Time To Detect", sub: "From hours to seconds" },
              { value: "95%", label: "False Positive Reduction", sub: "Via behavioral AI models" },
              { value: "24/7", label: "Continuous Monitoring", sub: "Zero gaps, zero downtime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center glass-card p-8 rounded-2xl glow-teal">
                <AnimatedCounter target={stat.value} />
                <h3 className="text-lg font-semibold text-white mt-4 mb-2">{stat.label}</h3>
                <p className="text-text-muted text-sm">{stat.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-text-muted">Result: lower breach costs, better efficiency, and stronger security posture.</p>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="technology" className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">BUILT WITH</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">Enterprise-Grade Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: <Server className="h-8 w-8" />, name: "Backend", tools: "Python + FastAPI", desc: "High-performance async APIs" },
              { icon: <Cpu className="h-8 w-8" />, name: "Machine Learning", tools: "Scikit-Learn", desc: "XGBoost, Isolation Forest, SHAP" },
              { icon: <Radio className="h-8 w-8" />, name: "Streaming", tools: "Redis Streams", desc: "Real-time ingestion and processing" },
              { icon: <Monitor className="h-8 w-8" />, name: "Frontend", tools: "Next.js + React", desc: "Interactive dashboards" },
              { icon: <Container className="h-8 w-8" />, name: "Infrastructure", tools: "Docker", desc: "Containerized deployments" },
            ].map((tech) => (
              <div key={tech.name} className="bg-navy p-5 rounded-xl border border-border text-center hover:border-teal/30 transition-all group">
                <div className="text-teal mb-3 flex justify-center group-hover:scale-110 transition-transform">{tech.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{tech.name}</h3>
                <p className="text-teal text-xs mb-1">{tech.tools}</p>
                <p className="text-text-muted text-xs">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-teal/10 to-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Protect Your Network?</h2>
          <p className="text-text-muted mb-10">Join AEGIS AI and turn your security from a cost center into a strategic advantage.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register" className="px-8 py-3.5 text-base font-semibold bg-white text-navy rounded-xl hover:bg-gray-100 transition-all shadow-lg">
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-3.5 text-base font-semibold text-teal border border-teal/30 rounded-xl hover:bg-teal/10 transition-all">
              Sign In
            </Link>
          </div>
          <p className="text-text-muted text-sm">No credit card required  •  Setup in minutes  •  Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080d1a] border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-6 w-6 text-teal" />
                <span className="font-bold text-white">AEGIS AI</span>
              </div>
              <p className="text-text-muted text-sm">Autonomous Cyber-Immune Platform</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <div className="space-y-2">
                {["Features", "How It Works", "Technology"].map((l) => (
                  <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="block text-sm text-text-muted hover:text-teal transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <div className="space-y-2">
                {["About", "Blog", "Careers"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-text-muted hover:text-teal transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <div className="space-y-2">
                {["Privacy", "Terms", "Security"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-text-muted hover:text-teal transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-text-muted text-sm">© 2026 AEGIS AI. Built by Algorithm Avengers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
