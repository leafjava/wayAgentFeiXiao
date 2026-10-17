import { NextResponse } from "next/server";
import { chainService } from "@/modules/chain/chain.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = await chainService.status();
  return NextResponse.json(s);
}
