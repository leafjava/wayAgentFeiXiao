import { NextRequest, NextResponse } from "next/server";
import { trackingService } from "@/modules/tracking/tracking.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
  return NextResponse.json({ consents: await trackingService.listConsents(projectId) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, platform, actionType, userLabel, amount } = body;
    if (!projectId || !platform || !actionType) return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    const r = await trackingService.requestExecution({ projectId, platform, actionType, userLabel, amount });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
