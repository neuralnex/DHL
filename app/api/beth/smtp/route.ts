import { encryptSecret } from "@/lib/crypto/storage";
import { getDataSource } from "@/lib/db/data-source";
import { SmtpSettings } from "@/lib/db/entities";
import { invalidateSmtpCache } from "@/lib/email/smtp";
import {
  SMTP_SETTINGS_ID,
} from "@/lib/services/smtp-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ds = await getDataSource();
    const row = await ds.getRepository(SmtpSettings).findOne({
      where: { id: SMTP_SETTINGS_ID },
    });
    if (!row) {
      return NextResponse.json({
        configured: false,
        host: "",
        port: 587,
        secure: false,
        user: "",
        fromEmail: "",
        hasPassword: false,
        updatedAt: null,
        sourceHint:
          "Using environment SMTP_* variables until you save settings here.",
      });
    }
    return NextResponse.json({
      configured: true,
      host: row.host,
      port: row.port,
      secure: row.secure,
      user: row.user,
      fromEmail: row.fromEmail,
      hasPassword: Boolean(
        row.passwordEncrypted && row.passwordEncrypted.length > 0,
      ),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const host = String(body.host ?? "").trim();
    const port = Number(body.port ?? 587);
    const secure = Boolean(body.secure);
    const user = String(body.user ?? "").trim();
    const fromEmail = String(body.fromEmail ?? "").trim();
    const passwordPlain = body.password != null ? String(body.password) : "";

    if (!host || !fromEmail) {
      return NextResponse.json(
        { error: "host and fromEmail are required" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      return NextResponse.json({ error: "Invalid port" }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(SmtpSettings);
    const row = await repo.findOne({ where: { id: SMTP_SETTINGS_ID } });

    let passwordEncrypted: string | null;
    if (passwordPlain.length > 0) {
      passwordEncrypted = encryptSecret(passwordPlain);
    } else if (row?.passwordEncrypted) {
      passwordEncrypted = row.passwordEncrypted;
    } else {
      passwordEncrypted = encryptSecret("");
    }

    const payload = repo.create({
      id: SMTP_SETTINGS_ID,
      host,
      port,
      secure,
      user,
      fromEmail,
      passwordEncrypted,
      updatedAt: new Date(),
    });

    await repo.save(payload);
    invalidateSmtpCache();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
