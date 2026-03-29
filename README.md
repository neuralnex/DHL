# WestridgeLogistics — Shipment tracking

Next.js app for staff-managed shipments and **public tracking** by tracking number. Includes a simulated global route, Mapbox map, timeline with staff approval, and queued email notifications (Redis + worker + SMTP).

## Prerequisites

- **Node.js** 20+ recommended  
- **PostgreSQL** 16+  
- **Redis**  
- **SMTP** (or [Mailpit](https://mailpit.axllent.org/) via Docker for local dev)

## Quick start

```bash
npm install
```

1. **Copy environment** — Create a `.env` file in the project root (see [Environment variables](#environment-variables) below).

2. **Start dependencies** (example with Docker):

   ```bash
   docker compose up -d postgres redis
   ```

   Optional local mail UI:

   ```bash
   docker compose up -d mailpit
   ```

   Then point SMTP to `localhost` port `1025` and open [http://localhost:8025](http://localhost:8025) to read messages.

3. **Run the web app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Run the notification worker** (separate terminal; required for scheduled/approval emails)

   ```bash
   npm run worker
   ```

Without the worker running, jobs are still created but **emails are not sent**.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/logistics_sim`) |
| `REDIS_URL` | Redis URL (e.g. `redis://127.0.0.1:6379`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Outbound email for the worker |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox token for **public tracking map** and **staff create-shipment** geocoding (optional but recommended) |
| `TYPEORM_SYNC` | Set `true` in dev to auto-sync schema; use migrations in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Staff login for `/beth` and protected APIs |
| `ADMIN_SESSION_SECRET` | JWT signing secret (min 32 characters) |
| `SETTINGS_ENCRYPTION_KEY` | Optional; encrypts SMTP password if stored in DB (defaults to session secret) |

## How to use

### Public — customers

- **Home:** `/` — marketing site, track entry.  
- **Track lookup:** `/track` — enter a tracking number.  
- **Track details:** `/track/[trackingNumber]` — status, map, activity timeline (pending vs confirmed).  
- **Customer service** links in the UI open email to **westridgelogistics01@gmail.com**.

Tracking numbers are generated as **`WRL` + 12 digits** (e.g. `WRL847291056384`), similar in spirit to carrier-style IDs.

### Staff — admins

1. Sign in at **`/beth/login`** with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.  
2. **Dashboard:** `/beth` — shortcuts to ship, list, email.  
3. **Create shipment:** `/beth/ship`  
   - Origin/destination labels (required).  
   - Coordinates: pick a **Mapbox** suggestion, or fill **optional latitude/longitude** fields, or use the API (see below).  
   - Sender/receiver email, optional customer name, service level, ETA, notes.  
4. **Shipments list:** `/beth/shipments`  
5. **Shipment detail:** `/beth/shipments/[trackingNumber]` — edit fields, **approve timeline points in order**, add stops, delete shipment.  
6. **Manual email:** `/beth/settings/email` — send ad-hoc messages (SMTP still from `.env`).

### API — create shipment (staff session)

`POST /api/shipments` (requires admin cookie session) accepts JSON including:

- `originLabel`, `destinationLabel` (required)  
- `originCoords` / `destinationCoords` as `{ "lng": number, "lat": number }`, **or** flat fields like `originLat`, `originLng`, `destinationLat`, `destinationLng`  
- `receiverEmail`, `senderEmail`, `weightKg`, plus optional fields as in the app

## Production build (local check)

```bash
npm run build
npm start
```

Run **`npm run worker`** in another terminal to verify the full stack locally.

---

## Deployment

This app is **not** a single static site. In production you must run:

| Piece | Role |
|--------|------|
| **Next.js** | `npm run build` then `npm start` (or platform equivalent) |
| **Worker** | `npm run worker` — **long-running**; processes BullMQ email jobs |
| **PostgreSQL** | Primary database |
| **Redis** | Queue for notification jobs |

If the worker is not deployed or cannot reach Redis, the site works but **emails will not send**.

### 1. Pre-deploy checklist

1. **Secrets** — Use strong random values for `ADMIN_SESSION_SECRET` (≥32 chars) and production `ADMIN_PASSWORD`. Never commit `.env`.
2. **Database** — Provision PostgreSQL; set `DATABASE_URL` (often with `?sslmode=require` on hosted providers).
3. **Redis** — Provision Redis; set `REDIS_URL` (TLS URLs if your host requires it).
4. **SMTP** — Production mailbox or transactional provider (SendGrid, Resend, Amazon SES, etc.); set all `SMTP_*` variables.
5. **Mapbox** — Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in the **build environment** of your Next.js host (inlined at build time for client-side map/geocode).
6. **Schema** — Set `TYPEORM_SYNC=false` in production and run **migrations** (or a one-time controlled sync) before going live; `TYPEORM_SYNC=true` is convenient for dev only.
7. **Health** — After deploy, open `/`, `/track`, log in to `/beth/login`, create a test shipment, and confirm the worker delivers a test email.

### 2. Option A — One VPS or dedicated server (simple mental model)

1. Install Node.js 20+, PostgreSQL, Redis (or use managed DB/Redis with firewall rules).
2. Clone the repo, `npm ci`, copy `.env` with production values.
3. `npm run build`
4. Run two supervised processes (pick one approach):
   - **systemd** — two units: one `npm start` (or `node_modules/.bin/next start`), one `npm run worker`.
   - **PM2** — `pm2 start npm --name web -- start` and `pm2 start npm --name worker -- run worker`.
5. Put **Nginx** (or Caddy) in front: reverse proxy `https://yourdomain` → `127.0.0.1:3000`, enable TLS (Let’s Encrypt).
6. Open only ports **80/443** on the server; keep Postgres/Redis on private network or localhost.

### 3. Option B — Docker Compose on a server

1. Extend your stack with a **Node** image service that runs `next start` after `next build`, and a **second** service running `tsx worker.ts` (or build then `node` the compiled worker if you add a build step).
2. Use official or managed **Postgres** and **Redis** services in the same compose file or as cloud plugins.
3. Pass the same `.env` (or secrets) to both the web and worker containers so `DATABASE_URL`, `REDIS_URL`, and SMTP match.

*(This repo ships `docker-compose.yml` for Postgres/Redis/Mailpit locally; production compose is yours to tailor.)*

### 4. Option C — Split platforms (common for Next.js)

- **Web:** Deploy Next.js to **Vercel**, **Netlify**, **Railway**, **Render**, **Fly.io**, etc. Configure all server-side env vars there, including `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for builds.
- **Worker:** Deploy **only** the worker as a separate **long-running** service on **Railway**, **Render** (background worker), **Fly.io**, **ECS**, etc. Same repo, start command `npm run worker`, same `DATABASE_URL`, `REDIS_URL`, `SMTP_*`, and session/crypto secrets if the worker reads them.
- **Data:** Use managed **PostgreSQL** and **Redis** (Neon, Supabase, Upstash, ElastiCache, etc.) reachable from both web and worker.

**Note:** Vercel serverless functions are **not** a drop-in replacement for `npm run worker`; keep the worker as its own process.

### 5. Domains and HTTPS

- Point DNS **A/AAAA** or **CNAME** to your load balancer or VPS.
- Terminate TLS at the reverse proxy or the PaaS edge; enforce HTTPS for `/beth` and `/api`.

### 6. After go-live

- Monitor worker logs for SMTP/Redis errors.
- Rotate `ADMIN_PASSWORD` and session secret if they were ever exposed.
- Back up PostgreSQL on your provider’s schedule.

## More detail

See **[SYSTEM_FLOW_USAGE.md](./SYSTEM_FLOW_USAGE.md)** for approval workflow, email flow, troubleshooting, and day-to-day operations.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run worker` | BullMQ worker for notification jobs |
| `npm run lint` | ESLint |

## License

Private project — all rights reserved unless stated otherwise.
