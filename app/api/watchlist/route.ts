import { NextRequest, NextResponse } from "next/server";
import { trackingService } from "@/modules/tracking/tracking.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await trackingService.listWatch() });
}

export async function POST(req: NextRequest) {
  const { projectId, note = "", budget = 0 } = await req.json();
  if (!projectId) return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
  return NextResponse.json(await trackingService.addWatch(projectId, note, budget));
}
