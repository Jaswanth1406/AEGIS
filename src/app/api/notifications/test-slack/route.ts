import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { neon } from "@neondatabase/serverless";
import { sendSlackNotification } from "@/lib/notification-delivery";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = neon(process.env.NEON_DATABASE_URL || "");
    const rows = await sql`
      SELECT "slack_webhook_url", "slack_integration"
      FROM "user"
      WHERE "id" = ${session.user.id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    const webhookUrl = String(user.slack_webhook_url || "").trim();
    const slackEnabled = !!user.slack_integration;

    if (!slackEnabled) {
      return NextResponse.json({ error: "Slack integration is disabled in settings" }, { status: 400 });
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: "Slack webhook URL is not configured" }, { status: 400 });
    }

    const result = await sendSlackNotification({
      webhookUrl,
      message: `:satellite_antenna: AEGIS test Slack alert at ${new Date().toISOString()}`,
    });

    if (!result.sent) {
      return NextResponse.json({ success: false, reason: result.reason || "not_sent" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send test Slack message" }, { status: 500 });
  }
}
