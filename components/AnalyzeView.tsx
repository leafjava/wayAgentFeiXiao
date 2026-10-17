"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string; symbol: string; category: string };

export function AnalyzeView({ projects, projectId }: { projects: Project[]; projectId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [fund, setFund] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [risk, setRisk] = useState<any[]>([]);

  async function setProject(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("projectId", id);
    router.push(url.toString());
  }

  async function analyze() {
    const r = await fetch(`/api/analyze?projectId=${projectId}`);
    const d = await r.json();
    setSummary(d.summary || "");
    setFund(d.fundamentals);
    setMarket(d.market);
    setRisk(d.riskFactors || []);
  }
  async function evalRisk() {
    const r = await fetch(`/api/risk?projectId=${projectId}`);
    const d = await r.json();
    setSummary((s) => s);
    setRisk([{ factor: `${d.status} (score ${d.score?.toFixed(1)})`, severity: d.status === "HEALTHY" ? "low" : d.status === "NEEDS_REVIEW" ? "medium" : "high", note: d.note || "" }, ...(d.riskFactors || [])]);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-slate-100 font-bold">TokenTruth</a>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-300 text-sm">帮我分析</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-100">帮我分析</h1>
        <p className="text-slate-400 text-sm">整理公司基本面、新闻、市场数据、社区信息，解释变化和风险。</p>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select value={projectId} onChange={(e) => setProject(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.symbol})</option>)}
          </select>
          <button onClick={analyze} className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm">分析</button>
          <button onClick={evalRisk} className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm">重新评估风险</button>
        </div>

        <div id="summary" className="mt-4 text-slate-300 text-sm">{summary}</div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <Panel title="基本面" icon="fa-building">
            <pre className="text-xs text-slate-400 whitespace-pre-wrap">
{JSON.stringify(fund, null, 2)}
            </pre>
          </Panel>
          <Panel title="市场与社区" icon="fa-line-chart">
            <pre className="text-xs text-slate-400 whitespace-pre-wrap">
{JSON.stringify(market, null, 2)}
            </pre>
          </Panel>
          <Panel title="风险因素" icon="fa-warning">
            {risk.length === 0 ? <div className="text-emerald-300 text-xs">✓ 未发现明显风险</div> :
              <ul className="text-xs space-y-1">
                {risk.map((r, i) => (
                  <li key={i} className="border-l-2 pl-2 py-1" style={{ borderColor: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#64748b" }}>
                    <div className="text-slate-200">{r.factor}</div>
                    <div className="text-slate-500 text-[10px]">{r.note}</div>
                  </li>
                ))}
              </ul>
            }
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-slate-100">
        <i className={`fa ${icon}`} /> {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
