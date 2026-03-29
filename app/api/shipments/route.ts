import { isAdminSession } from "@/lib/auth/session-api";
import { parseShipmentCoordsFromBody } from "@/lib/shipment/parse-request-coords";
import { createShipment } from "@/lib/services/create-shipment";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Create shipment — admin session required; public users track only via GET /track/... */
export async function POST(req: Request) {
  try {
    if (!(await isAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const originLabel = String(body.originLabel ?? "").trim();
    const destinationLabel = String(body.destinationLabel ?? "").trim();
    const receiverEmail = String(body.receiverEmail ?? "").trim();
    const senderEmail = String(body.senderEmail ?? "").trim();
    const { originCoords, destinationCoords } =
      parseShipmentCoordsFromBody(body);
    const estimatedDeliveryAtRaw =
      body.estimatedDeliveryAt != null
        ? String(body.estimatedDeliveryAt).trim()
        : "";
    const weightKg = Number(body.weightKg);
    const customerName =
      body.customerName != null
        ? String(body.customerName).trim() || null
        : null;
    const serviceLevel =
      body.serviceLevel != null
        ? String(body.serviceLevel).trim() || null
        : null;
    const internalNotes =
      body.internalNotes != null
        ? String(body.internalNotes).trim() || null
        : null;

    if (!originLabel || !destinationLabel) {
      return NextResponse.json(
        { error: "originLabel and destinationLabel are required" },
        { status: 400 },
      );
    }
    if (!receiverEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid receiverEmail is required" },
        { status: 400 },
      );
    }
    if (!senderEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid senderEmail is required" },
        { status: 400 },
      );
    }
    if (estimatedDeliveryAtRaw) {
      const eta = new Date(estimatedDeliveryAtRaw);
      if (Number.isNaN(eta.getTime())) {
        return NextResponse.json(
          { error: "estimatedDeliveryAt must be a valid date-time" },
          { status: 400 },
        );
      }
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return NextResponse.json(
        { error: "weightKg must be a positive number" },
        { status: 400 },
      );
    }

    const result = await createShipment({
      originLabel,
      destinationLabel,
      originCoords,
      destinationCoords,
      receiverEmail,
      senderEmail,
      weightKg,
      estimatedDeliveryAt: estimatedDeliveryAtRaw || null,
      customerName,
      serviceLevel,
      internalNotes,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
