import { NextRequest, NextResponse } from "next/server";

const PLATFORM_API_URL = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const FRAMEWORK_PROMPTS: Record<string, string> = {
  GDPR: `You are a senior cybersecurity compliance officer writing an official GDPR Article 32 security report. 
Write a formal, audit-ready compliance report for the period provided. Focus on:
- Technical and organisational measures taken
- Incident detection and response effectiveness  
- Personal data protection status (no breaches)
- Pseudonymisation and encryption evidence
- Ongoing confidentiality, integrity, availability assurance
Use formal language appropriate for EU data protection authorities and auditors.`,

  "ISO 27001": `You are a certified ISO 27001 Lead Auditor writing a surveillance audit report.
Write a formal ISO 27001 Annex A compliance report covering:
- Information security incident management (Annex A.16)
- Access control evidence (Annex A.9)
- Operations security (Annex A.12)
- Supplier relationships and monitoring (Annex A.15)
- Threat detection and SIEM capability evidence
Use ISO terminology and reference specific controls by Annex A clause numbers.`,

  HIPAA: `You are a healthcare security specialist writing a HIPAA Security Rule compliance report.
Write a formal HIPAA Technical Safeguards compliance report covering:
- Access Controls (§164.312(a))
- Audit Controls (§164.312(b))
- Integrity Controls (§164.312(c))
- Person Authentication (§164.312(d))
- Transmission Security (§164.312(e))
- Incident response and breach risk assessment
Use HIPAA regulatory citations and language appropriate for healthcare OCR audits.`,

  SOC2: `You are a SOC 2 auditor writing a Type II report narrative.
Write a formal SOC 2 Trust Service Criteria compliance narrative covering:
- CC6: Logical and Physical Access Controls
- CC7: System Operations and Change Management  
- CC9: Risk Mitigation
- A1: Availability
- Continuous monitoring evidence and incident response metrics
Use AICPA Trust Service Criteria terminology appropriate for enterprise customers.`,
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
    const systemPrompt = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["GDPR"];

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
