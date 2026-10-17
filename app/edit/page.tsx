import { prisma } from "@/lib/prisma";
import { EditDocView } from "../../components/EditDocView";

export const dynamic = "force-dynamic";

export default async function EditDocPage({ searchParams }: { searchParams: { projectId?: string; docType?: string } }) {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  const projectId = searchParams.projectId || projects[0]?.id || "demo-mon";
  const docType = searchParams.docType || "whitepaper";
  return <EditDocView projects={projects.map((p: any) => ({ id: p.id, name: p.name }))} projectId={projectId} docType={docType} />;
}
