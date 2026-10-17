import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";
import { listTemplates } from "@/modules/company/content.service";
import { CompanyView } from "../../components/CompanyView";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ searchParams }: { searchParams: { projectId?: string } }) {
  await ensureSeed();
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  const projectId = searchParams.projectId || projects[0]?.id || "demo-mon";
  return <CompanyView projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} templates={listTemplates()} projectId={projectId} />;
}
