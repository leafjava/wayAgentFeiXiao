import { NextRequest, NextResponse } from "next/server";
import { trackingService } from "@/modules/tracking/tracking.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
  const consentId = req.nextUrl.searchParams.get("consentId") ?? undefined;
  return NextResponse.json({ executions: await trackingService.listExecutions(projectId, consentId) });
}
