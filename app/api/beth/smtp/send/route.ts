import { sendDirectEmail } from "@/lib/email/smtp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const toRaw = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!toRaw) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const to = toRaw
      .split(/[,;\n]+/g)
      .map((v) => v.trim())
      .filter(Boolean);

    await sendDirectEmail({
      to,
      subject,
      bodyText: message,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
