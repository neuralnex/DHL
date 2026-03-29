# Logistics Tracking System Flow & Usage

This guide explains how to run and use this logistics tracking system from setup to daily operations.

## 1) What This System Does

- Lets an admin create and manage shipments.
- Gives customers a public tracking page by tracking number.
- Uses an approval workflow for timeline points.
- Sends email notifications to both sender and receiver.
- Supports manual email sending for exceptional delays.

## 2) Tech Components

- **Web app:** Next.js (`npm run dev`)
- **Database:** PostgreSQL
- **Queue:** Redis + BullMQ
- **Email sender:** Worker process (`npm run worker`) + SMTP from `.env`
- **Map:** Mapbox only — GL JS + Turf on the public track page; Mapbox Geocoding on the staff create-shipment form (place search)

## 3) Required Environment Variables

Set these in `.env`:

- `DATABASE_URL`
- `REDIS_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (tracking map + geocoding on create shipment)
- `TYPEORM_SYNC` (usually `true` in local dev)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## 4) Start the System

Use separate terminals:

1. Start dependencies (example):
   - `docker compose up -d postgres redis`
2. Start app:
   - `npm run dev`
3. Start worker:
   - `npm run worker`

If worker is not running, notifications will not be delivered.

## 5) Login & Roles

- Staff login: `/beth/login`
- Public tracking page: `/track` and `/track/[trackingNumber]`
- `/beth` and `/api/beth` routes are protected by the same admin session middleware.

## 6) Shipment Creation Flow (staff)

Page: `/beth/ship`

1. Enter origin and destination (Mapbox place search worldwide). Select a suggestion so coordinates are stored; simulation uses lat/long plus a global airport list for routing.
2. Enter sender and receiver email.
3. Optional: customer name, service level, notes, manual ETA.
4. Submit.

System behavior:

- Creates shipment + route segments + timeline events.
- Schedules notification jobs for relevant events.
- Redirects to shipment detail page.

## 7) Approval Workflow (Important)

Page: `/beth/shipments/[trackingNumber]`

- Timeline points are approved **in sequence only**.
- Only the next pending point can be approved.
- Approving a point:
  - marks it confirmed,
  - stamps current approval time,
  - queues email notification immediately.

Public side behavior:

- Yellow point = pending
- Green point = confirmed

## 8) Email Notification Flow

When event notification runs:

1. Worker reads queued job.
2. Worker loads shipment and event.
3. Worker sends email to:
   - `receiverEmail`
   - `senderEmail` (if present)
4. Worker logs sent/failed status.

Notes:

- Approval notifications use forced-send mode to avoid old dedupe skips.
- SMTP settings are read from `.env`.

## 9) Manual Email Flow (Operational Delays)

Page: `/beth/settings/email`

- SMTP config form was removed (env-only setup).
- Use **Send manual email** section for unautomated updates.
- Recipients can be comma-separated (example: sender + receiver).

## 10) Time Display Behavior

- Timeline and shipment times show:
  - relative time (`x min ago`)
  - local time (viewer timezone)
  - UTC time (shared reference)
- Times refresh periodically; no static timestamps for active views.

## 11) Public Tracking Experience

Page: `/track/[trackingNumber]`

- Shipment info + route map + timeline.
- No admin internals are exposed.
- Confirmation state is shown as neutral public status only.

## 12) Common Troubleshooting

### No email received

Check in order:

1. `npm run worker` is running
2. Redis is running and `REDIS_URL` is correct
3. SMTP env values are valid
4. Worker terminal logs for errors

### Approval button disabled

- Previous point has not been approved yet.
- Approve points in order.

### Map or route looks off

- Ensure `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is valid (used for maps and geocoding).
- Use suggested geocoded place names for better coordinate capture.

### Admin cannot access pages

- Verify `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.

## 13) Recommended Daily Operations

1. Start app + worker + dependencies.
2. Create shipment from `/beth/ship`.
3. Approve timeline points in sequence as shipment progresses.
4. Use manual email tool for special delay communication.
5. Use public tracking URL to verify customer-facing state.

