import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendEmailNotification } from "@/lib/notification-delivery";

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.WEEKLY_REPORT_CRON_SECRET;
    const authHeader = req.headers.get("authorization") || "";
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const users = await sql`
      SELECT "email", "weekly_report", "email_notifications"
      FROM "user"
      WHERE COALESCE("weekly_report", TRUE) = TRUE
        AND COALESCE("email_notifications", TRUE) = TRUE
    `;

    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000";
    let summary = "Weekly summary unavailable.";

    try {
      const statsRes = await fetch(`${apiBase}/api/dashboard/stats`, {
        headers: { Authorization: "Bearer demo-token" },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        summary = [
          `Critical Threats: ${stats.critical_threats ?? 0}`,
          `Active Alerts: ${stats.active_alerts ?? 0}`,
          `Threats Contained: ${stats.threats_contained ?? 0}`,
          `Avg Response Time: ${stats.avg_response_time ?? "<1"}ms`,
        ].join("\n");
      }
    } catch (e) {
      // Keep fallback summary
    }

    let sent = 0;
    for (const user of users) {
      try {
        await sendEmailNotification({
          to: String(user.email),
          subject: "[AEGIS] Weekly Security Summary",
          body: `Your weekly AEGIS report:\n\n${summary}`,
        });
        sent += 1;
      } catch (e) {
        // Continue with next user
      }
    }

    return NextResponse.json({ success: true, users: users.length, sent });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
