"use client";

import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string };
type Template = { key: string; title: string; structure: string[] };

export function CompanyView({ projects, templates, projectId }: { projects: Project[]; templates: Template[]; projectId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function setProject(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("projectId", id);
    router.push(url.toString());
  }

  async function generate(tplKey: string) {
    setBusy(tplKey);
    try {
      const r = await fetch("/api/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, template: tplKey, audience: "investor" }),
      });
      setResult(await r.json());
    } finally { setBusy(null); }
  }

  return (
    <div className="workspace-page">
<main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-100">项目方后台</h1>
        <p className="text-slate-400 text-sm">辅助生成介绍材料、视频脚本、新闻内容、FAQ。</p>

        <div className="mt-4 flex items-center gap-3">
          <select value={projectId} onChange={(e) => setProject(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Link href={`/edit?projectId=${projectId}`} className="text-xs text-indigo-300 hover:text-indigo-200">编辑资料 →</Link>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-100">内容模板</h3>
            <div className="mt-3 space-y-1 text-xs">
              {templates.map((t) => (
                <button key={t.key} onClick={() => generate(t.key)} disabled={busy === t.key} className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50">
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-slate-500 ml-2">{t.structure.length} 段</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-100">生成结果</h3>
            {result ? (
              result.error ? <div className="text-rose-400 text-xs mt-3">{result.error}</div> : (
                <div className="mt-3 text-xs text-slate-400">
                  <div className="text-slate-100 text-sm font-semibold">{result.title}</div>
                  {result.sections?.map((s: any, i: number) => (
                    <div key={i} className="mt-2">
                      <div className="text-slate-300 text-[11px] font-semibold">{s.heading}</div>
                      <div className="text-slate-400 text-xs mt-1">{s.body}</div>
                    </div>
                  ))}
                  {result.onChain && (
                    <div className="mt-3 bg-indigo-900/20 border border-indigo-800/40 rounded p-2">
                      <div className="text-indigo-300 text-xs font-semibold">✓ 已上链</div>
                      <div className="font-mono text-[10px] text-slate-500 break-all">tx: {result.onChain.txHash}</div>
                      <Link href={`/proof?hash=${result.onChain.evidenceHash}`} className="text-indigo-300 hover:underline text-[10px]">→ 验证</Link>
                    </div>
                  )}
                </div>
              )
            ) : <p className="text-slate-500 text-xs mt-3">点击左侧模板开始生成</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
