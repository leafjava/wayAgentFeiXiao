import { NextRequest, NextResponse } from "next/server";
import { qaService } from "@/modules/qa/qa.service";
import { chainService } from "@/modules/chain/chain.service";
import { hashCanonical } from "@/lib/hash";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, question, anchorOnChain = false, preferLlm = true } = body;
    if (!projectId || !question) return NextResponse.json({ error: "缺少 projectId 或 question" }, { status: 400 });
    const ans = await qaService.ask(projectId, question, preferLlm);
    let onChain: any = undefined;
    if (anchorOnChain) {
      const payload = {
        projectId,
        question,
        conclusion: ans.conclusion,
        citations: ans.citations.map((c) => c.docId + "@" + c.version),
        timestamp: Math.floor(Date.now() / 1000),
      };
      try {
        const r = await chainService.anchor(payload, {
          evidenceId: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          evidenceType: "INVESTOR_QA",
          projectId,
        });
        onChain = { evidenceHash: r.evidenceHash, txHash: r.txHash, blockNumber: r.blockNumber.toString(), status: r.status };
      } catch (e) {
        onChain = { error: (e as Error).message };
      }
    }
    return NextResponse.json({ ...ans, onChain });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
