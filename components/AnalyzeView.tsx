"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/modules/knowledge/analyzer.service";

type Project = { id: string; name: string; symbol: string; category: string };
export function AnalyzeView({ projects, projectId }: { projects: Project[]; projectId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [risk, setRisk] = useState<AnalysisResult["riskFactors"]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const analyze = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);setError("");
    try {
      const response = await fetch(`/api/analyze?projectId=${encodeURIComponent(projectId)}`, { signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "分析失败");
      setData(result);setRisk(result.riskFactors || []);
    } catch (e) {
      if (!signal?.aborted) setError((e as Error).message);
    } finally { if (!signal?.aborted) setBusy(false); }
  }, [projectId]);
  useEffect(() => { const abort = new AbortController();void analyze(abort.signal);return () => abort.abort(); }, [analyze]);
  function setProject(id: string) {
    const url = new URL(window.location.href);url.searchParams.set("projectId", id);
    router.push(url.pathname + url.search);
  }
  async function evalRisk() {
    try {
      const response = await fetch(`/api/risk?projectId=${encodeURIComponent(projectId)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "风险评估失败");
      setRisk([{ factor: `${result.status} · ${result.score?.toFixed(1)} 分`, severity: result.status === "HEALTHY" ? "low" : result.status === "NEEDS_REVIEW" ? "medium" : "high", note: result.note || "" }, ...(data?.riskFactors || [])]);
    } catch (e) { setError((e as Error).message); }
  }
  const fund = data?.fundamentals;
  return <div className="workspace-page">
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-100">帮我分析</h1>
      <p className="text-slate-400 text-sm">整理公司基本面、新闻、市场数据、社区信息，解释变化和风险。</p>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <select aria-label="分析项目" value={projectId} onChange={e => setProject(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} (${p.symbol})</option>)}
        </select>
        <button onClick={() => analyze()} disabled={busy} className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm">{busy ? "分析中…" : "分析"}</button>
        <button onClick={evalRisk} disabled={busy} className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm">重新评估风险</button>
      </div>
      {error && <p role="alert" className="text-rose-300 mt-4 text-sm">{error}</p>}
      <p className="mt-4 text-slate-300 text-sm" aria-live="polite">{data?.summary || "正在读取项目资料…"}</p>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <Panel title="基本面">
          <p>资料完整度：<span className="text-slate-100">{fund ? `${Math.round(fund.dataCompleteness * 100)}%` : "—"}</span></p>
          <h4 className="mt-3 text-slate-300">团队</h4><Details values={fund?.team.map(t => t.info)} />
          <h4 className="mt-3 text-slate-300">融资</h4><Details values={fund?.funding.rounds} />
          <h4 className="mt-3 text-slate-300">应用场景</h4><Details values={fund?.useCases} />
        </Panel>
        <Panel title="市场与社区">
          <p>赛道：{data?.market.sector || "—"}</p><p>市场分层：{data?.market.tier || "—"}</p><p>流通比例：{data?.market.circulatingSupply || "—"}</p>
          <p className="mt-2 text-amber-300">{data?.market.note}</p>
          <p className="mt-3">新闻 {data?.community.newsCount ?? "—"} 条 · 社区 {data?.community.communityPostCount ?? "—"} 条</p>
          <p>情绪：{data?.community.sentiment || "—"}</p>
          {data?.community.signals.map((s, i) => <p key={i} className="mt-2 border-l border-slate-600 pl-2">{s.content}</p>)}
        </Panel>
        <Panel title="风险因素">
          {!data ? <p>等待分析结果</p> : risk.length === 0 ? <p className="text-emerald-300">未发现明显风险</p> : <ul className="space-y-3">{risk.map((r, i) => <li key={i} className="border-l-2 pl-2" style={{ borderColor: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#9fe0ff" }}><p className="text-slate-100">{r.factor}</p><p>{r.note}</p></li>)}</ul>}
        </Panel>
      </div>
    </main>
  </div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4"><h3 className="text-sm font-semibold text-slate-100">{title}</h3><div className="mt-3 text-xs text-slate-400 leading-relaxed">{children}</div></section>;
}
function Details({ values }: { values?: string[] }) {
  return values?.length ? <ul className="space-y-1">{values.map((v, i) => <li key={i}>{v}</li>)}</ul> : <p>资料中未提取到相关信息</p>;
}
