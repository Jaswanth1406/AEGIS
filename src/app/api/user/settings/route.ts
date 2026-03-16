import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { neon } from "@neondatabase/serverless";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionTimeout, darkMode } = await req.json();

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const timeoutVal = parseInt(sessionTimeout) || 30;
    const darkVal = !!darkMode;

    await sql`
      UPDATE "user" 
      SET "session_timeout" = ${timeoutVal}, "dark_mode" = ${darkVal} 
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

    const rows = await sql`
      SELECT "session_timeout", "dark_mode" 
      FROM "user" 
      WHERE "id" = ${session.user.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ sessionTimeout: "30", darkMode: false });
    }

    return NextResponse.json({
      sessionTimeout: rows[0].session_timeout?.toString() || "30",
      darkMode: !!rows[0].dark_mode,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
