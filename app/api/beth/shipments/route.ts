import { getDataSource } from "@/lib/db/data-source";
import { Shipment } from "@/lib/db/entities";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ds = await getDataSource();
    const rows = await ds.getRepository(Shipment).find({
      order: { createdAt: "DESC" },
      take: 100,
    });
    return NextResponse.json({
      shipments: rows.map((s) => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        referenceCode: s.referenceCode,
        status: s.status,
        originLabel: s.originLabel,
        destinationLabel: s.destinationLabel,
        customerName: s.customerName,
        serviceLevel: s.serviceLevel,
        weightKg: s.weightKg,
        createdAt: s.createdAt.toISOString(),
        estimatedDeliveryAt: s.estimatedDeliveryAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
