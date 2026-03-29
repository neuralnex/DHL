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

## Production build

```bash
npm run build
npm start
```

Run **`npm run worker`** as a separate process in production as well.

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
