import { NextRequest, NextResponse } from "next/server";
import { trackingService } from "@/modules/tracking/tracking.service";
import { projectsService } from "@/modules/projects/projects.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, platform, amount, userLabel = "demo-user" } = body;
    if (!projectId || !platform || !amount) return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    const project = await projectsService.get(projectId);
    if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    try {
      const r = await trackingService.buy({ projectId, platform, amount, userLabel, category: project.category });
      return NextResponse.json(r);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
