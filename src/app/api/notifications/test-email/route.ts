import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendEmailNotification } from "@/lib/notification-delivery";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "No user email found" }, { status: 400 });
    }

    const apiBase = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "http://11.12.6.240:8000";
    let weeklyLines = [
      "Critical Threats: unavailable",
      "Active Alerts: unavailable",
      "Threats Contained: unavailable",
      "Avg Response Time: unavailable",
    ];

    try {
      const statsRes = await fetch(`${apiBase}/api/dashboard/stats`, {
        headers: { Authorization: "Bearer demo-token" },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        weeklyLines = [
          `Critical Threats: ${stats.critical_threats ?? 0}`,
          `Active Alerts: ${stats.active_alerts ?? 0}`,
          `Threats Contained: ${stats.threats_contained ?? 0}`,
          `Avg Response Time: ${stats.avg_response_time ?? "<1"}ms`,
        ];
      }
    } catch {
      // Keep fallback unavailable lines if stats fetch fails
    }

    const result = await sendEmailNotification({
      to: userEmail,
      subject: "[AEGIS] Test Email Notification + Weekly Report",
      body: [
        "This is a test email from AEGIS.",
        "",
        "If you received this, Email Notifications are configured correctly.",
        "",
        "Weekly Report",
        "Receive weekly security summary",
        ...weeklyLines,
        `Sent at: ${new Date().toISOString()}`,
      ].join("\n"),
    });

    if (!result.sent) {
      return NextResponse.json({ success: false, reason: result.reason || "not_sent" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
