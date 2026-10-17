import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: { projectId: string } }) {
  await ensureSeed();
  const project = await prisma.project.findUnique({ where: { id: params.projectId } });
  if (!project) notFound();
  const docs = await prisma.document.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: "desc" },
  });
  const versions = await prisma.version.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: "desc" },
  });
  const versionsByType: Record<string, any[]> = {};
  for (const v of versions) {
    versionsByType[v.docType] = versionsByType[v.docType] ?? [];
    versionsByType[v.docType].push(v);
  }
  const risk = await prisma.riskState.findUnique({ where: { projectId: params.projectId } });

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
          ← 返回目录
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              {project.name} <span className="text-slate-500 text-lg">${project.symbol}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {project.sector} {project.category?.startsWith("rwa") && <span className="text-emerald-300">· RWA</span>}
            </p>
            <p className="text-slate-400 text-sm mt-2 max-w-3xl">{project.description}</p>
          </div>
          {risk && (
            <div className="text-right">
              <div className="text-xs text-slate-500">风险状态</div>
              <div
                className="text-lg font-bold"
                style={{ color: risk.status === "HEALTHY" ? "#10b981" : risk.status === "NEEDS_REVIEW" ? "#f59e0b" : "#ef4444" }}
              >
                {risk.status}
              </div>
              <div className="text-xs text-slate-500 mt-1">score {risk.score.toFixed(1)}</div>
            </div>
          )}
        </div>

        <div className="mt-6 grid md:grid-cols-4 gap-3">
          <ModuleLink href={`/chat?projectId=${params.projectId}`} color="indigo" icon="fa-comments" title="问得明白" />
          <ModuleLink href={`/analyze?projectId=${params.projectId}`} color="purple" icon="fa-bar-chart" title="分析" />
          <ModuleLink href="/track" color="amber" icon="fa-bell" title="加入关注" />
          <ModuleLink href={`/company?projectId=${params.projectId}`} color="emerald" icon="fa-edit" title="项目方视图" />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-slate-100 mb-3">已收录资料（{docs.length} 份）</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {docs.map((d: any) => (
              <div key={d.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{d.docType}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px]"
                    style={{
                      background: d.trustLevel === "official" ? "#10b98133" : d.trustLevel === "news" ? "#f59e0b33" : "#64748b33",
                      color: d.trustLevel === "official" ? "#10b981" : d.trustLevel === "news" ? "#f59e0b" : "#94a3b8",
                    }}
                  >
                    {d.trustLevel}
                  </span>
                </div>
                <h4 className="text-slate-100 font-semibold mt-2">{d.title}</h4>
                <p className="text-slate-400 text-xs mt-1 line-clamp-3">{d.content.slice(0, 200)}{d.content.length > 200 ? "…" : ""}</p>
                <div className="text-slate-500 text-[10px] mt-2 font-mono">v[{(versionsByType[d.docType] || []).length}] · {d.source}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleLink({ href, color, icon, title }: { href: string; color: string; icon: string; title: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-900/30 border-indigo-800/40 hover:bg-indigo-900/50",
    purple: "bg-purple-900/30 border-purple-800/40 hover:bg-purple-900/50",
    amber: "bg-amber-900/30 border-amber-800/40 hover:bg-amber-900/50",
    emerald: "bg-emerald-900/30 border-emerald-800/40 hover:bg-emerald-900/50",
  };
  return (
    <Link href={href} className={`${colorMap[color]} border rounded-xl p-4 text-center transition`}>
      <i className={`fa ${icon} text-2xl text-slate-100`} />
      <div className="text-slate-100 font-semibold mt-2 text-sm">{title}</div>
    </Link>
  );
}
