export interface Threat {
  id: string;
  name: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sourceIP: string;
  targetSystem: string;
  timestamp: Date;
  status: "Investigating" | "Contained" | "Blocked" | "Active" | "Mitigating" | "Mitigated";
  description: string;
  details: {
    attackVector: string;
    indicators: string[];
    affectedSystems: string[];
    recommendedAction: string;
    aiConfidence?: number;
  };
  shap_values?: { feature: string; value: number }[];
  ai_analysis?: string | null;
  confidence_score?: number;
  anomaly_score?: number;
  suggested_playbook?: any[]; // AI suggested action steps
}

export interface Playbook {
  id: string;
  name: string;
  icon: string;
  description: string;
  actions: string[];
  steps: {
    name: string;
    description: string;
    status: "pending" | "running" | "completed";
  }[];
}

export interface AttackOrigin {
  name: string;
  coordinates: [number, number];
  type: "origin" | "target";
  threats: number;
}

export interface AIExplanation {
  factor: string;
  score: number;
  color: string;
}

// 15 threat events
export const threats: Threat[] = [
  {
    id: "THR-001",
    name: "Data Exfiltration Attempt",
    type: "Data Breach",
    severity: "CRITICAL",
    sourceIP: "185.143.223.47",
    targetSystem: "DB-Primary-01",
    timestamp: new Date(Date.now() - 2000),
    status: "Investigating",
    description: "Anomalous outbound data transfer detected from primary database server. 2.4GB transferred in 3 minutes to external IP.",
    details: {
      attackVector: "SQL Injection → Data Exfiltration",
      indicators: ["Unusual query patterns", "Large data transfer", "Non-standard port usage"],
      affectedSystems: ["DB-Primary-01", "Web-Server-03", "API-Gateway"],
      recommendedAction: "Isolate affected database server and block outbound connections to suspicious IP."
    }
  },
  {
    id: "THR-002",
    name: "Brute Force Login Attack",
    type: "Authentication",
    severity: "HIGH",
    sourceIP: "91.234.56.78",
    targetSystem: "Auth-Server-01",
    timestamp: new Date(Date.now() - 15000),
    status: "Blocked",
    description: "1,247 failed login attempts detected from single IP targeting admin accounts.",
    details: {
      attackVector: "Credential Stuffing",
      indicators: ["Rapid login attempts", "Multiple usernames", "Tor exit node"],
      affectedSystems: ["Auth-Server-01"],
      recommendedAction: "IP blocked. Monitor for distributed attack pattern."
    }
  },
  {
    id: "THR-003",
    name: "Ransomware Behavior Detected",
    type: "Malware",
    severity: "CRITICAL",
    sourceIP: "10.0.15.234",
    targetSystem: "Workstation-HR-07",
    timestamp: new Date(Date.now() - 30000),
    status: "Contained",
    description: "File encryption patterns detected on HR workstation. Lateral movement attempted.",
    details: {
      attackVector: "Phishing Email → Macro Execution → Ransomware",
      indicators: ["Mass file renaming", "Encryption patterns", "C2 communication"],
      affectedSystems: ["Workstation-HR-07", "FileShare-02"],
      recommendedAction: "System isolated. Restore from backup after forensic analysis."
    }
  },
  {
    id: "THR-004",
    name: "DDoS Attack Detected",
    type: "Network",
    severity: "HIGH",
    sourceIP: "Multiple (Botnet)",
    targetSystem: "Load-Balancer-01",
    timestamp: new Date(Date.now() - 45000),
    status: "Active",
    description: "Volumetric DDoS attack reaching 45 Gbps. Traffic originating from 12,000+ unique IPs.",
    details: {
      attackVector: "UDP Flood + SYN Flood",
      indicators: ["Traffic spike 4000%", "Geographically distributed", "IoT botnet signatures"],
      affectedSystems: ["Load-Balancer-01", "CDN-Edge-Nodes"],
      recommendedAction: "DDoS mitigation engaged. Upstream filtering active."
    }
  },
  {
    id: "THR-005",
    name: "Privilege Escalation",
    type: "Insider Threat",
    severity: "CRITICAL",
    sourceIP: "10.0.8.112",
    targetSystem: "AD-Controller-01",
    timestamp: new Date(Date.now() - 60000),
    status: "Investigating",
    description: "User account escalated to domain admin outside of change window. Suspicious lateral movement detected.",
    details: {
      attackVector: "Kerberoasting → Golden Ticket",
      indicators: ["Service ticket harvesting", "Unusual admin activity", "Off-hours access"],
      affectedSystems: ["AD-Controller-01", "AD-Controller-02"],
      recommendedAction: "Reset KRBTGT password. Audit all domain admin accounts."
    }
  },
  {
    id: "THR-006",
    name: "Suspicious DNS Tunneling",
    type: "Network",
    severity: "MEDIUM",
    sourceIP: "10.0.22.45",
    targetSystem: "DNS-Server-01",
    timestamp: new Date(Date.now() - 90000),
    status: "Investigating",
    description: "Abnormal DNS query patterns suggesting data exfiltration via DNS tunneling.",
    details: {
      attackVector: "DNS Tunneling",
      indicators: ["High entropy DNS queries", "Unusual TXT record requests", "Consistent beacon pattern"],
      affectedSystems: ["DNS-Server-01"],
      recommendedAction: "Block suspicious domain. Monitor endpoint for malware."
    }
  },
  {
    id: "THR-007",
    name: "Phishing Campaign Detected",
    type: "Social Engineering",
    severity: "HIGH",
    sourceIP: "203.0.113.42",
    targetSystem: "Email-Gateway-01",
    timestamp: new Date(Date.now() - 120000),
    status: "Blocked",
    description: "Bulk phishing emails targeting finance department with fake invoice attachments.",
    details: {
      attackVector: "Spear Phishing → Credential Harvesting",
      indicators: ["Spoofed sender domain", "Malicious attachment", "Targeting pattern"],
      affectedSystems: ["Email-Gateway-01"],
      recommendedAction: "Emails quarantined. User awareness alert sent."
    }
  },
  {
    id: "THR-008",
    name: "Cryptominer Detected",
    type: "Malware",
    severity: "MEDIUM",
    sourceIP: "10.0.31.88",
    targetSystem: "Server-DevOps-03",
    timestamp: new Date(Date.now() - 180000),
    status: "Contained",
    description: "Cryptocurrency mining software detected on development server consuming 95% CPU.",
    details: {
      attackVector: "Container Escape → Cryptominer Installation",
      indicators: ["High CPU usage", "Mining pool connections", "Unauthorized process"],
      affectedSystems: ["Server-DevOps-03"],
      recommendedAction: "Container terminated. Image scanning initiated."
    }
  },
  {
    id: "THR-009",
    name: "API Key Exposure",
    type: "Data Breach",
    severity: "HIGH",
    sourceIP: "N/A (GitHub)",
    targetSystem: "CI/CD-Pipeline",
    timestamp: new Date(Date.now() - 240000),
    status: "Contained",
    description: "Production API keys found in public GitHub repository commit.",
    details: {
      attackVector: "Secret Exposure via Version Control",
      indicators: ["Public commit with secrets", "Key pattern match", "Automated scanning triggered"],
      affectedSystems: ["CI/CD-Pipeline", "Production-API"],
      recommendedAction: "Keys rotated. Repository made private. Git history cleaned."
    }
  },
  {
    id: "THR-010",
    name: "Port Scan Activity",
    type: "Reconnaissance",
    severity: "LOW",
    sourceIP: "45.33.32.156",
    targetSystem: "Perimeter-FW-01",
    timestamp: new Date(Date.now() - 300000),
    status: "Blocked",
    description: "Full port scan detected from known scanning service targeting internet-facing assets.",
    details: {
      attackVector: "Network Reconnaissance",
      indicators: ["Sequential port scanning", "Known scanner IP", "Multiple protocols"],
      affectedSystems: ["Perimeter-FW-01"],
      recommendedAction: "IP blocked. Normal reconnaissance activity."
    }
  },
  {
    id: "THR-011",
    name: "Zero-Day Exploit Attempt",
    type: "Vulnerability",
    severity: "CRITICAL",
    sourceIP: "198.51.100.23",
    targetSystem: "Web-Server-01",
    timestamp: new Date(Date.now() - 5000),
    status: "Active",
    description: "Unknown exploit targeting web application framework. No matching signature in database.",
    details: {
      attackVector: "Unknown (Zero-Day)",
      indicators: ["Anomalous request pattern", "Buffer overflow attempt", "No signature match"],
      affectedSystems: ["Web-Server-01"],
      recommendedAction: "WAF rules updated. Behavioral analysis engaged."
    }
  },
  {
    id: "THR-012",
    name: "Unauthorized VPN Access",
    type: "Authentication",
    severity: "MEDIUM",
    sourceIP: "77.88.55.66",
    targetSystem: "VPN-Gateway-01",
    timestamp: new Date(Date.now() - 350000),
    status: "Blocked",
    description: "VPN login from unusual geographic location for user account.",
    details: {
      attackVector: "Credential Compromise → VPN Access",
      indicators: ["Impossible travel", "New device fingerprint", "Unusual location"],
      affectedSystems: ["VPN-Gateway-01"],
      recommendedAction: "Session terminated. MFA reset required."
    }
  },
];

// New threats that get added periodically
export const additionalThreats: Partial<Threat>[] = [
  {
    name: "SQL Injection Attempt",
    type: "Web Attack",
    severity: "HIGH",
    sourceIP: "172.16.0." + Math.floor(Math.random() * 255),
    targetSystem: "Web-App-02",
    status: "Blocked",
    description: "Automated SQL injection attack detected on web application login form.",
  },
  {
    name: "Lateral Movement Detected",
    type: "Insider Threat",
    severity: "CRITICAL",
    sourceIP: "10.0.5." + Math.floor(Math.random() * 255),
    targetSystem: "Server-Finance-01",
    status: "Investigating",
    description: "Compromised account attempting lateral movement across finance network segment.",
  },
  {
    name: "Malicious File Upload",
    type: "Malware",
    severity: "HIGH",
    sourceIP: "103.224.182." + Math.floor(Math.random() * 255),
    targetSystem: "FileShare-01",
    status: "Contained",
    description: "Trojanized document uploaded to shared drive. Auto-quarantined by endpoint protection.",
  },
  {
    name: "C2 Beacon Detected",
    type: "Malware",
    severity: "CRITICAL",
    sourceIP: "10.0.17." + Math.floor(Math.random() * 255),
    targetSystem: "Workstation-ENG-12",
    status: "Investigating",
    description: "Periodic beacon traffic detected communicating with known command and control server.",
  },
  {
    name: "Suspicious PowerShell Execution",
    type: "Endpoint",
    severity: "MEDIUM",
    sourceIP: "10.0.9." + Math.floor(Math.random() * 255),
    targetSystem: "Workstation-IT-03",
    status: "Investigating",
    description: "Obfuscated PowerShell script execution detected outside of normal admin activity.",
  },
];

// 4 playbooks
export const playbooks: Playbook[] = [
  {
    id: "PB-001",
    name: "Compromised Account",
    icon: "🔐",
    description: "Lock · Reset · Alert",
    actions: ["Lock Account", "Reset Credentials", "Alert Team"],
    steps: [
      { name: "Observe", description: "Analyze login patterns and confirm compromise indicators", status: "pending" },
      { name: "Isolate", description: "Lock the compromised account and revoke all active sessions", status: "pending" },
      { name: "Remediate", description: "Reset password, enable MFA, and scan for persistence mechanisms", status: "pending" },
      { name: "Validate", description: "Verify account security and restore access with monitoring", status: "pending" },
    ],
  },
  {
    id: "PB-002",
    name: "Malicious Traffic",
    icon: "🚫",
    description: "Block IP · Firewall · Log",
    actions: ["Block IP", "Update Firewall", "Log Evidence"],
    steps: [
      { name: "Observe", description: "Capture traffic samples and identify malicious patterns", status: "pending" },
      { name: "Isolate", description: "Block source IP at firewall and update WAF rules", status: "pending" },
      { name: "Remediate", description: "Scan affected systems and patch vulnerable services", status: "pending" },
      { name: "Validate", description: "Confirm traffic is blocked and monitor for evasion attempts", status: "pending" },
    ],
  },
  {
    id: "PB-003",
    name: "Malware Behavior",
    icon: "🦠",
    description: "Kill · Isolate · Scan",
    actions: ["Kill Process", "Isolate Host", "Full Scan"],
    steps: [
      { name: "Observe", description: "Identify malicious process and capture memory dump", status: "pending" },
      { name: "Isolate", description: "Network-isolate the affected host and kill malicious processes", status: "pending" },
      { name: "Remediate", description: "Run full antimalware scan and remove persistence mechanisms", status: "pending" },
      { name: "Validate", description: "Verify system integrity and reconnect to network with monitoring", status: "pending" },
    ],
  },
  {
    id: "PB-004",
    name: "Network Recon",
    icon: "🕵️",
    description: "Deceive · Redirect · Collect",
    actions: ["Deploy Honeypot", "Redirect Traffic", "Collect Intel"],
    steps: [
      { name: "Observe", description: "Monitor scanning patterns and identify reconnaissance tools", status: "pending" },
      { name: "Isolate", description: "Redirect attacker to honeypot environment for intelligence gathering", status: "pending" },
      { name: "Remediate", description: "Block scanner IPs and harden exposed services", status: "pending" },
      { name: "Validate", description: "Review collected intelligence and update threat indicators", status: "pending" },
    ],
  },
];

// Attack origins for map
export const attackOrigins: AttackOrigin[] = [
  { name: "Russia", coordinates: [37.6173, 55.7558], type: "origin", threats: 45 },
  { name: "China", coordinates: [116.4074, 39.9042], type: "origin", threats: 38 },
  { name: "North Korea", coordinates: [125.7625, 39.0392], type: "origin", threats: 12 },
  { name: "Iran", coordinates: [51.3890, 35.6892], type: "origin", threats: 18 },
  { name: "Brazil", coordinates: [-43.1729, -22.9068], type: "origin", threats: 8 },
];

export const protectedTargets: AttackOrigin[] = [
  { name: "United States", coordinates: [-77.0369, 38.9072], type: "target", threats: 0 },
  { name: "United Kingdom", coordinates: [-0.1276, 51.5074], type: "target", threats: 0 },
  { name: "Germany", coordinates: [13.4050, 52.5200], type: "target", threats: 0 },
  { name: "Japan", coordinates: [139.6917, 35.6895], type: "target", threats: 0 },
];

// AI explanation scores
export const aiExplanations: AIExplanation[] = [
  { factor: "Login from new location", score: 82, color: "#00d4ff" },
  { factor: "Data transfer 2.4GB in 3min", score: 91, color: "#ff3b3b" },
  { factor: "Outside business hours", score: 74, color: "#00d4ff" },
  { factor: "Unauthorized executable", score: 88, color: "#ff3b3b" },
];

// Generate a new threat
let threatCounter = 13;
export function generateNewThreat(): Threat {
  const template = additionalThreats[Math.floor(Math.random() * additionalThreats.length)];
  threatCounter++;
  return {
    id: `THR-${String(threatCounter).padStart(3, "0")}`,
    name: template.name || "Unknown Threat",
    type: template.type || "Unknown",
    severity: template.severity || "MEDIUM",
    sourceIP: template.sourceIP || "0.0.0.0",
    targetSystem: template.targetSystem || "Unknown",
    timestamp: new Date(),
    status: template.status || "Investigating",
    description: template.description || "",
    details: {
      attackVector: "Automated Detection",
      indicators: ["Behavioral anomaly detected"],
      affectedSystems: [template.targetSystem || "Unknown"],
      recommendedAction: "Investigate and respond according to playbook.",
    },
  };
}

// User mock
export const mockUser = {
  id: "user-001",
  name: "Alex Morgan",
  email: "alex.morgan@aegis-ai.com",
  image: null,
};
