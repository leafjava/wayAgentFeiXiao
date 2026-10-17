import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackingService } from "@/modules/tracking/tracking.service";
import { projectsService } from "@/modules/projects/projects.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const planInput = z.object({
  projectId: z.string().min(1),
  budget: z.coerce.number().finite().min(0),
  riskPreference: z.enum(["conservative", "balanced", "aggressive"]),
  trackingFrequency: z.enum(["daily", "weekly", "on_event"]),
  notes: z.string().default(""),
});
export async function GET(request: NextRequest) {
  return NextResponse.json({ plans: await trackingService.listPlans(request.nextUrl.searchParams.get("projectId") || undefined) });
}
export async function POST(request: NextRequest) {
  const parsed = planInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "投资计划参数无效" }, { status: 400 });
  const { projectId, ...plan } = parsed.data;
  if (!await projectsService.get(projectId)) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json(await trackingService.savePlan(projectId, plan));
}
