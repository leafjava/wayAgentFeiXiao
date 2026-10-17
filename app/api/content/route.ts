import { NextRequest, NextResponse } from "next/server";
import { projectsService } from "@/modules/projects/projects.service";
import { generate as genContent } from "@/modules/company/content.service";
import { chainService } from "@/modules/chain/chain.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, template, audience = "investor" } = body;
    if (!projectId || !template) return NextResponse.json({ error: "缺少 projectId 或 template" }, { status: 400 });
    const project = await projectsService.get(projectId);
    if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    const content: any = genContent(project, template, audience);
    if (!content.error) {
      try {
        const r = await chainService.anchor({ projectId, template, content }, {
          evidenceId: `content-${template}-${Date.now()}`,
          evidenceType: "CONTENT_PUBLISH",
          projectId,
          docVersion: template,
        });
        content.onChain = { evidenceHash: r.evidenceHash, txHash: r.txHash, blockNumber: r.blockNumber.toString(), status: r.status };
      } catch (e) {
        content.onChain = { error: (e as Error).message };
      }
    }
    return NextResponse.json(content);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
