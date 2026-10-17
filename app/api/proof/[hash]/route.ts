import { NextRequest, NextResponse } from "next/server";
import { chainService } from "@/modules/chain/chain.service";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { hash: string } }) {
  const hash = params.hash as `0x${string}`;
  const result = await chainService.verify(hash);
  const status = await chainService.status().catch(() => null);
  return NextResponse.json({
    evidenceHash: hash,
    onChain: { exists: result.exists, record: result.record, explorerUrl: result.exists && status ? `${status.explorer}/tx/${hash}` : "" },
    mode: status?.mode ?? "mock",
  });
}
