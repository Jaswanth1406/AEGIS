import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { sendEmailNotification, sendSlackNotification } from "@/lib/notification-delivery";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const severity = String(body?.severity || "").toUpperCase();
    const threatType = String(body?.threat_type || "Unknown Threat");
    const sourceIp = String(body?.source_ip || "Unknown IP");
    const targetSystem = String(body?.target_system || "Unknown");

    if (severity !== "CRITICAL") {
      return NextResponse.json({ success: true, skipped: "non_critical" });
    }

    const sql = neon(process.env.NEON_DATABASE_URL || "");
    const rows = await sql`
      SELECT
        "email",
        "email_notifications",
        "critical_alerts",
        "slack_integration",
        "slack_webhook_url"
      FROM "user"
      WHERE "id" = ${session.user.id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    const emailNotifications = user.email_notifications !== false;
    const criticalAlerts = user.critical_alerts !== false;
    const slackIntegration = !!user.slack_integration;
    const slackWebhookUrl = String(user.slack_webhook_url || "");

    if (!criticalAlerts) {
      return NextResponse.json({ success: true, skipped: "critical_alerts_disabled" });
    }

    const subject = `[AEGIS] CRITICAL Threat: ${threatType}`;
    const message = [
      "CRITICAL threat detected in AEGIS.",
      `Type: ${threatType}`,
      `Source IP: ${sourceIp}`,
      `Target: ${targetSystem}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n");

    const results = {
      email: { sent: false as boolean, reason: "disabled" as string },
      slack: { sent: false as boolean, reason: "disabled" as string },
    };

    if (emailNotifications) {
      try {
        const res = await sendEmailNotification({
          to: String(user.email),
          subject,
          body: message,
        });
        results.email = { sent: !!res.sent, reason: res.sent ? "sent" : String(res.reason || "failed") };
      } catch (e) {
        results.email = { sent: false, reason: "send_failed" };
      }
    }

    if (slackIntegration && slackWebhookUrl) {
      try {
        const res = await sendSlackNotification({
          webhookUrl: slackWebhookUrl,
          message: `:rotating_light: *CRITICAL Threat*\n*Type:* ${threatType}\n*Source:* ${sourceIp}\n*Target:* ${targetSystem}`,
        });
        results.slack = { sent: !!res.sent, reason: res.sent ? "sent" : String(res.reason || "failed") };
      } catch (e) {
        results.slack = { sent: false, reason: "send_failed" };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
