import { NextRequest, NextResponse } from "next/server";
import { seedAll } from "@/modules/seed/seed.data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const r = await seedAll();
  return NextResponse.json(r);
}
