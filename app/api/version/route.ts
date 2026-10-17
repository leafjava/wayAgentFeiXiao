import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectsService } from "@/modules/projects/projects.service";
import { chainService } from "@/modules/chain/chain.service";
import { diffVersions } from "@/modules/company/version-diff";
import { hashCanonical } from "@/lib/hash";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

// GET /api/version/list?projectId=...&docType=...
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
  const docType = req.nextUrl.searchParams.get("docType") ?? "";
  if (!projectId || !docType) return NextResponse.json({ error: "缺少 projectId/docType" }, { status: 400 });
  return NextResponse.json({ versions: await projectsService.listVersions(projectId, docType) });
}

// POST /api/version  (new version on-chain)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, docType, content, changes = {} } = body;
    if (!projectId || !docType || !content) return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    const latest = await projectsService.latestVersion(projectId, docType);
    const parentVersion = latest?.version ?? null;
    let newVersion = "v1.0";
    if (latest) {
      try {
        const n = parseFloat(latest.version.replace("v", ""));
        newVersion = `v${(n + 0.1).toFixed(1)}`;
      } catch {
        newVersion = "v1.1";
      }
    }
    const contentHash = hashCanonical({ content, docType });
    const v = await prisma.version.create({
      data: {
        id: randomUUID(),
        projectId, docType, version: newVersion, contentHash, content,
        parentVersion, changesJson: JSON.stringify(changes), createdAt: Math.floor(Date.now() / 1000),
      },
    });
    // 同步更新 documents 表
    await prisma.document.create({
      data: {
        id: randomUUID(),
        projectId, docType, title: `${docType} ${newVersion}`,
        content, source: "company", sourceUrl: "", trustLevel: "official",
        createdAt: Math.floor(Date.now() / 1000),
      },
    });
    // 链上存证
    let onChain: any = undefined;
    try {
      const r = await chainService.anchor(
        { projectId, docType, version: newVersion, contentHash },
        { evidenceId: `version-${Date.now()}`, evidenceType: "PROJECT_DISCLOSURE", projectId, docVersion: newVersion, fromStatus: parentVersion ?? "", toStatus: newVersion },
      );
      onChain = { evidenceHash: r.evidenceHash, txHash: r.txHash, blockNumber: r.blockNumber.toString(), status: r.status };
    } catch (e) {
      onChain = { error: (e as Error).message };
    }
    // diff
    let diff: any = null;
    if (latest) {
      diff = diffVersions(
        { version: latest.version, content: latest.content, contentHash: latest.contentHash, changes: JSON.parse(latest.changesJson || "{}") },
        { version: newVersion, content, contentHash, changes },
      );
    }
    return NextResponse.json({ versionId: v.id, version: newVersion, contentHash, parentVersion, diff, onChain });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
