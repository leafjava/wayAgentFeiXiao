import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";
import { ChatView } from "../../components/ChatView";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: { projectId?: string } }) {
  await ensureSeed();
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  const projectId = searchParams.projectId || projects[0]?.id || "demo-mon";
  return <ChatView projects={projects.map(toMini)} projectId={projectId} />;
}

function toMini(p: any) {
  return { id: p.id, name: p.name, symbol: p.symbol, category: p.category };
}
