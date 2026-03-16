import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { neon } from "@neondatabase/serverless";

async function ensureUserSettingsColumns(sql: any) {
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "session_timeout" INTEGER DEFAULT 30`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dark_mode" BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_notifications" BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "critical_alerts" BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "weekly_report" BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "slack_integration" BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "slack_webhook_url" TEXT`;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sessionTimeout,
      darkMode,
      emailNotifications,
      criticalAlerts,
      weeklyReport,
      slackIntegration,
      slackWebhookUrl,
    } = await req.json();

    const sql = neon(process.env.NEON_DATABASE_URL || "");
    await ensureUserSettingsColumns(sql);

    const timeoutVal = parseInt(sessionTimeout) || 30;
    const darkVal = !!darkMode;
    const emailVal = emailNotifications !== undefined ? !!emailNotifications : true;
    const criticalVal = criticalAlerts !== undefined ? !!criticalAlerts : true;
    const weeklyVal = weeklyReport !== undefined ? !!weeklyReport : true;
    const slackVal = slackIntegration !== undefined ? !!slackIntegration : false;
    const slackWebhookVal = typeof slackWebhookUrl === "string" ? slackWebhookUrl.trim() : "";

    await sql`
      UPDATE "user" 
      SET
        "session_timeout" = ${timeoutVal},
        "dark_mode" = ${darkVal},
        "email_notifications" = ${emailVal},
        "critical_alerts" = ${criticalVal},
        "weekly_report" = ${weeklyVal},
        "slack_integration" = ${slackVal},
        "slack_webhook_url" = ${slackWebhookVal || null}
      WHERE "id" = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = neon(process.env.NEON_DATABASE_URL || "");
    await ensureUserSettingsColumns(sql);

    const rows = await sql`
      SELECT
        "session_timeout",
        "dark_mode",
        "email_notifications",
        "critical_alerts",
        "weekly_report",
        "slack_integration",
        "slack_webhook_url"
      FROM "user" 
      WHERE "id" = ${session.user.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        sessionTimeout: "30",
        darkMode: false,
        emailNotifications: true,
        criticalAlerts: true,
        weeklyReport: true,
        slackIntegration: false,
        slackWebhookUrl: "",
      });
    }

    return NextResponse.json({
      sessionTimeout: rows[0].session_timeout?.toString() || "30",
      darkMode: !!rows[0].dark_mode,
      emailNotifications: rows[0].email_notifications !== false,
      criticalAlerts: rows[0].critical_alerts !== false,
      weeklyReport: rows[0].weekly_report !== false,
      slackIntegration: !!rows[0].slack_integration,
      slackWebhookUrl: rows[0].slack_webhook_url || "",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
