import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";
import { AnalyzeView } from "../../components/AnalyzeView";
import { DEMO_PROJECTS } from "@/modules/projects/demo-fallback";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({ searchParams }: { searchParams: { projectId?: string } }) {
  let projects: any[] = [];
  try { await ensureSeed(); projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } }); } catch { projects = DEMO_PROJECTS; }
  const projectId = searchParams.projectId || projects[0]?.id || "demo-mon";
  return <AnalyzeView projects={projects.map((p: any) => ({ id: p.id, name: p.name, symbol: p.symbol, category: p.category }))} projectId={projectId} />;
}
