import { NextResponse } from "next/server";
import { PLATFORMS, RWA_ACTIONS } from "@/modules/tracking/platforms.constants";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    platforms: PLATFORMS,
    rwaActions: Array.from(RWA_ACTIONS),
  });
}
