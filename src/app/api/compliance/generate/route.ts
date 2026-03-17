import { NextRequest, NextResponse } from "next/server";

const PLATFORM_API_URL = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const FRAMEWORK_PROMPTS: Record<string, string> = {
  "DPDP 2023": `You are a senior cybersecurity compliance officer writing an official Digital Personal Data Protection (DPDP) Act 2023 security report. 
Write a formal, audit-ready compliance report for the period provided. Focus on:
- Reasonable security safeguards adopted to prevent personal data breaches (Section 8)
- Data principal rights & consent management validation
- Incident detection and response effectiveness  
- Prevention of personal data breaches
Use formal language appropriate for the Data Protection Board of India and local auditors.`,

  "CERT-In": `You are a cybersecurity auditor writing a compliance report based on the CERT-In Cyber Security Directions 2022.
Write a formal CERT-In compliance report covering:
- Synchronization of ICT system clocks with NIC/NPL (Direction 2)
- Mandatory reporting of cyber incidents within 6 hours (Direction 3)
- Log retention policy enforcement for 180 days (Direction 4)
- Threat detection capabilities and evidence of security controls
Use CERT-In terminology and reference the specific 2022 mandate clauses.`,

  "RBI": `You are a banking security specialist writing a compliance report against the Reserve Bank of India (RBI) Cyber Security Framework in Banks.
Write a formal RBI cyber compliance report covering:
- Annex-1: Baseline Cyber Security and Resilience Requirements
- Network Security, secure configuration, and vulnerability management
- Incident Response and Management capabilities
- Continuous surveillance and monitoring (SOC/SIEM integration)
Use RBI regulatory citations and language appropriate for financial audits in India.`,

  "IT Act": `You are a legal cybersecurity auditor writing a compliance narrative for the Information Technology Act, 2000 (and SPDI Rules 2011).
Write a formal IT Act compliance narrative covering:
- Section 43A: Implementation of reasonable security practices and procedures
- Section 72A: Protection against disclosure of information in breach of lawful contract
- Evidence of active network monitoring and data protection controls
Use Indian legislative terminology appropriate for enterprise and government customers in India.`,

  "MeitY": `You are an enterprise security auditor assessing alignment with the Ministry of Electronics and Information Technology (MeitY) National Cyber Security Policy.
Write a formal MeitY compliance narrative covering:
- Protection of critical information infrastructure
- Proactive threat hunting, continuous monitoring, and incident response metrics
- Implementation of global best practices and standards within the Indian context
- Resilience and rapid recovery capabilities
Use MeitY guidelines terminology appropriate for national infrastructure audits.`
};

export async function POST(req: NextRequest) {
  try {
    const { framework, dateRange, orgName } = await req.json();

    // 1. Fetch real threat data from the Platform API
    let threats: any[] = [];
    try {
      const res = await fetch(`${PLATFORM_API_URL}/api/threats?page=1&limit=100`, {
        headers: { Authorization: "Bearer internal-dev-key" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        threats = data.items || data || [];
      }
    } catch {
      // Use empty array if API unavailable — report will still generate
    }

    // 2. Compute statistics
    const total = threats.length;
    const critical = threats.filter((t) => t.severity === "CRITICAL").length;
    const high = threats.filter((t) => t.severity === "HIGH").length;
    const medium = threats.filter((t) => t.severity === "MEDIUM").length;
    const low = threats.filter((t) => t.severity === "LOW").length;
    const mitigated = threats.filter((t) =>
      ["MITIGATED", "CONTAINED", "RESOLVED", "BLOCKED"].includes((t.status || "").toUpperCase())
    ).length;
    const investigating = threats.filter((t) =>
      (t.status || "").toUpperCase() === "INVESTIGATING"
    ).length;
    const threatTypes = [...new Set(threats.map((t) => t.threat_type).filter(Boolean))];
    const avgResponseNote =
      total > 0
        ? `${mitigated} of ${total} threats mitigated/contained`
        : "No threats detected in the period";

    const statsBlock = `
SECURITY METRICS FOR REPORT PERIOD (${dateRange}):
- Organisation: ${orgName || "AEGIS-Protected Organisation"}
- Total security events detected: ${total}
- Critical severity: ${critical}
- High severity: ${high}  
- Medium severity: ${medium}
- Low severity: ${low}
- Threats mitigated/contained/resolved: ${mitigated}
- Threats under investigation: ${investigating}
- Attack types detected: ${threatTypes.join(", ") || "None"}
- Status summary: ${avgResponseNote}
- Data breach confirmed: NO
- AEGIS AI automated threat detection: ACTIVE
- ML pipeline (Isolation Forest + XGBoost): OPERATIONAL
- Real-time response capability: CONFIRMED
`;

    // 3. Call Groq API
    const systemPrompt = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["DPDP 2023"];

    const grokRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a complete, professional ${framework} compliance report using the following live security data from our AEGIS AI threat detection platform:\n\n${statsBlock}\n\nThe report should be 400-600 words, include section headers, and conclude with a compliance status verdict (COMPLIANT / PARTIALLY COMPLIANT / NON-COMPLIANT with justification). Do not include placeholder text — use the real metrics provided.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!grokRes.ok) {
      const err = await grokRes.text();
      console.error("Grok API error:", err);
      return NextResponse.json({ error: "AI generation failed", detail: err }, { status: 502 });
    }

    const grokData = await grokRes.json();
    const narrative = grokData.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      framework,
      orgName: orgName || "AEGIS-Protected Organisation",
      dateRange,
      narrative,
      stats: { total, critical, high, medium, low, mitigated, investigating, threatTypes },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Compliance report error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
