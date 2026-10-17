import { NextRequest, NextResponse } from "next/server";
import { trackingService } from "@/modules/tracking/tracking.service";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = await trackingService.removeWatch(params.id);
  return NextResponse.json({ removed: ok });
}
