import { decryptSecret } from "@/lib/crypto/storage";
import { getDataSource } from "@/lib/db/data-source";
import { SmtpSettings } from "@/lib/db/entities";

export const SMTP_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

export type ResolvedSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  source: "database" | "environment";
};

let cache: { cfg: ResolvedSmtp; at: number } | null = null;
const TTL_MS = 30_000;

export function invalidateSmtpCache(): void {
  cache = null;
}

export async function resolveSmtpConfig(): Promise<ResolvedSmtp | null> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache.cfg;
  }

  const ds = await getDataSource();
  const row = await ds.getRepository(SmtpSettings).findOne({
    where: { id: SMTP_SETTINGS_ID },
  });

  if (row?.host && row.fromEmail) {
    try {
      const password =
        row.passwordEncrypted != null && row.passwordEncrypted !== ""
          ? decryptSecret(row.passwordEncrypted)
          : "";
      const cfg: ResolvedSmtp = {
        host: row.host,
        port: row.port,
        secure: row.secure,
        user: row.user,
        password,
        from: row.fromEmail,
        source: "database",
      };
      cache = { cfg, at: now };
      return cfg;
    } catch {
      /* fall through */
    }
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASSWORD ?? "";
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!host || !from) {
    return null;
  }
  const cfg: ResolvedSmtp = {
    host,
    port,
    secure: port === 465,
    user,
    password: pass,
    from,
    source: "environment",
  };
  cache = { cfg, at: now };
  return cfg;
}
