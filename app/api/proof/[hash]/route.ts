import { NextRequest, NextResponse } from "next/server";
import { chainService } from "@/modules/chain/chain.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { hash: string } }) {
  const hash = params.hash as `0x${string}`;
  const result = await chainService.verify(hash);
  const status = await chainService.status().catch(() => null);
  return NextResponse.json({
    evidenceHash: hash,
    onChain: {
      exists: result.exists,
      record: result.record ? { ...result.record, timestamp: String(result.record.timestamp), blockNumber: String(result.record.blockNumber) } : null,
      explorerUrl: result.exists && status?.mode === "live" ? `${status.explorer}/address/${status.contractAddress}` : "",
    },
    mode: status?.mode ?? "mock",
  });
}
