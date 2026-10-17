import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";
import { ChatView } from "../../components/ChatView";
import { DEMO_PROJECTS } from "@/modules/projects/demo-fallback";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: { projectId?: string } }) {
  let projects: any[] = [];
  try { await ensureSeed(); projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } }); } catch (error) { console.warn("[chat] database unavailable, using demo projects", error); projects = DEMO_PROJECTS; }
  const projectId = searchParams.projectId || projects[0]?.id || "demo-mon";
  return <ChatView projects={projects.map(toMini)} projectId={projectId} />;
}

function toMini(p: any) {
  return { id: p.id, name: p.name, symbol: p.symbol, category: p.category };
}
