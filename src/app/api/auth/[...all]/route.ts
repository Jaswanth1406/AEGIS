import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import arcjet, {
  type BotOptions,
  detectBot,
  type EmailOptions,
  protectSignup,
  shield,
  slidingWindow,
  type SlidingWindowRateLimitOptions,
} from "@arcjet/next";
import ip from "@arcjet/ip";
import { NextResponse } from "next/server";

// Initialize Arcjet with shield protection
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userIdOrIp"],
  rules: [shield({ mode: "LIVE" })],
});

const botSettings = { mode: "LIVE", allow: [] } satisfies BotOptions;

const restrictiveRateLimitSettings = {
  mode: "LIVE",
  max: 10,
  interval: "10m",
} satisfies SlidingWindowRateLimitOptions<[]>;

const laxRateLimitSettings = {
  mode: "LIVE",
  max: 60,
  interval: "1m",
} satisfies SlidingWindowRateLimitOptions<[]>;

const emailSettings: EmailOptions = {
  mode: "LIVE",
  deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
};

const authHandlers = toNextJsHandler(auth);
export const { GET } = authHandlers;

export async function POST(req: Request) {
  // Clone for Arcjet check (we need to read body)
  const bodyText = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  // Reconstruct the request with the body for Better Auth
  const clonedReq = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: bodyText,
  });

  const decision = await checkArcjet(req, body);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    } else if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: "Bot activity detected. Request denied." },
        { status: 403 },
      );
    } else if (decision.reason.isEmail()) {
      let message: string;
      if (decision.reason.emailTypes.includes("DISPOSABLE")) {
        message = "Disposable email addresses are not allowed.";
      } else if (decision.reason.emailTypes.includes("INVALID")) {
        message = "Invalid email address.";
      } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
        message = "Email domain has no MX records.";
      } else {
        message = "Email address is not allowed.";
      }
      return NextResponse.json({ error: message }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Request denied." }, { status: 403 });
    }
  }
  
  // LIVE DEMO HOOK: Trigger an "Anomalous Login" threat if the request comes from an external IP
  const url = new URL(req.url);
  const isSignIn = url.pathname.includes("/sign-in/email") || url.pathname.includes("/signin/email");
  
  if (isSignIn) {
    const fwded = req.headers.get("x-forwarded-for");
    const rawIp = fwded ? fwded.split(',')[0].trim() : ip(req, { platform: "vercel" });
    
    // For demo: if someone logs in from outside localhost, simulate a VPN threat
    if (rawIp && rawIp !== "127.0.0.1" && rawIp !== "::1" && rawIp !== "localhost" && !rawIp.startsWith("192.168.")) {
      try {
        fetch("http://127.0.0.1:8000/api/internal/threats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threat_type: "Anomalous Login (VPN/Overseas)",
            severity: "HIGH",
            source_ip: rawIp,
            target_system: "auth-gateway",
            confidence_score: 0.96,
            anomaly_score: 0.89,
            explanation: `User attempted to authenticate from unauthorized external IP: ${rawIp}. Suspected compromised credentials or VPN usage.`,
            shap_values: [
              { feature: "location_mismatch", value: 0.65 },
              { feature: "impossible_travel_velocity", value: 0.45 },
              { feature: "login_time_anomaly", value: 0.20 }
            ],
            threat_fingerprint: [0.9, 0.1, 0.4, 0.8]
          })
        }).catch(() => {}); // Fire and forget
      } catch (err) {
        // Silently ignore to not break auth flow
      }
    }
  }

  return authHandlers.POST(clonedReq);
}

async function checkArcjet(req: Request, clonedBody: unknown) {
  const url = new URL(req.url);
  const session = await auth.api.getSession({ headers: req.headers });

  const clientIp = ip(req, { platform: "vercel" });
  const userIdOrIp = session?.user?.id || clientIp || "127.0.0.1";
  // Better Auth uses /api/auth/sign-up/email
  const isSignUp =
    url.pathname.includes("/sign-up/email") ||
    url.pathname.includes("/signup/email");
  const isSignIn =
    url.pathname.includes("/sign-in/email") ||
    url.pathname.includes("/signin/email");

  if (isSignUp || isSignIn) {
    if (
      clonedBody &&
      typeof clonedBody === "object" &&
      "email" in clonedBody &&
      typeof clonedBody.email === "string"
    ) {
      return aj
        .withRule(
          protectSignup({
            email: emailSettings,
            bots: botSettings,
            rateLimit: restrictiveRateLimitSettings,
          }),
        )
        .protect(req, { email: clonedBody.email, userIdOrIp });
    } else {
      // Auth email endpoint but no valid email in body – apply restrictive rate limit
      return aj
        .withRule(detectBot(botSettings))
        .withRule(slidingWindow(restrictiveRateLimitSettings))
        .protect(req, { userIdOrIp });
    }
  }

  // Default: lax rate limit for other auth endpoints
  return aj
    .withRule(detectBot(botSettings))
    .withRule(slidingWindow(laxRateLimitSettings))
    .protect(req, { userIdOrIp });
}
