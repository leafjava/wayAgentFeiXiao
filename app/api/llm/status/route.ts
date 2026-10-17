import { NextResponse } from "next/server";
import { env, llmEnabled } from "@/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: llmEnabled,
    model: env.DEEPSEEK_MODEL,
    baseUrl: env.DEEPSEEK_BASE_URL,
  });
}
