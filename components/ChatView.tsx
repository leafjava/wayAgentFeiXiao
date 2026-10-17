"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Project = { id: string; name: string; symbol: string; category: string };

const SUGGESTED = [
  "这家公司靠什么赚钱？",
  "我买的代币有什么权利？",
  "什么时候可以转让？",
  "未来一年有哪些解锁？",
  "这个项目当前最大的风险是什么？",
  "底层资产由谁托管？",
  "分红派息机制是什么？",
  "如何帮客户买代币？",
];

export function ChatView({ projects, projectId }: { projects: Project[]; projectId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [anchor, setAnchor] = useState(false);
  const [preferLlm, setPreferLlm] = useState(true);
  const [llmBadge, setLlmBadge] = useState<{ enabled: boolean; model?: string }>({ enabled: false });
  const [answers, setAnswers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/llm/status").then(r => r.json()).then(d => setLlmBadge(d));
  }, []);

  function setProject(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("projectId", id);
    router.push(url.toString());
  }

  async function ask() {
    const q = question.trim();
    if (!q) return;
    setBusy(true);
    setQuestion("");
    try {
      const r = await fetch("/api/qa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, question: q, anchorOnChain: anchor, preferLlm }),
      });
      const d = await r.json();
      setAnswers((prev) => [{ ...d, question: q, id: Date.now() }, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-slate-100 font-bold">TokenTruth</a>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-300 text-sm">问得明白</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-100">问得明白</h1>
        <p className="text-slate-400 text-sm">投资者直接提问，AI 根据项目资料给出带来源、时间、可信度、原文、风险的回答。</p>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select value={projectId} onChange={(e) => setProject(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.symbol})</option>)}
          </select>
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <input type="checkbox" checked={anchor} onChange={(e) => setAnchor(e.target.checked)} className="accent-indigo-500" /> 上链存证
          </label>
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <input type="checkbox" checked={preferLlm} onChange={(e) => setPreferLlm(e.target.checked)} className="accent-indigo-500" /> 启用 LLM
          </label>
          <span className={`text-[10px] px-2 py-0.5 rounded ${llmBadge.enabled ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/40" : "bg-amber-900/30 text-amber-300 border border-amber-800/40"}`}>
            LLM: {llmBadge.enabled ? llmBadge.model : "本地引擎"}
          </span>
        </div>

        <div className="mt-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && ask()}
              placeholder="这家公司靠什么赚钱？"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={ask} disabled={busy} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm">
              {busy ? "生成中…" : "提问"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => { setQuestion(s); }} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded">{s}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {answers.map((a) => <AnswerCard key={a.id} a={a} />)}
        </div>
      </main>
    </div>
  );
}

function AnswerCard({ a }: { a: any }) {
  const confColor = ({ high: "#10b981", medium: "#f59e0b", low: "#94a3b8" } as Record<string, string>)[a.confidence] || "#94a3b8";
  const confLabel = ({ high: "高", medium: "中", low: "低" } as Record<string, string>)[a.confidence] || a.confidence;
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
      <div className="text-slate-500 text-xs">Q · {a.question}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded" style={{ background: confColor + "33", color: confColor }}>置信度 {confLabel}</span>
        {a.llmUsed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">LLM {a.llmModel || ""}</span>}
        {!a.llmUsed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300">本地引擎</span>}
      </div>
      <div className="mt-3 text-slate-100 text-sm whitespace-pre-wrap leading-relaxed">{a.conclusion}</div>
      {a.reasoning && <div className="mt-3 text-xs text-slate-500"><b>推理：</b>{a.reasoning}</div>}
      {a.risks?.length ? (
        <div className="mt-2 text-xs text-amber-300">
          <b>风险提示：</b>
          <ul className="list-disc pl-5 mt-1">{a.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
        </div>
      ) : null}
      {a.citations?.length ? (
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-2">引用来源（{a.citations.length}）</div>
          <div className="space-y-2">
            {a.citations.map((c: any, i: number) => (
              <div key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: ({ official: "#10b981", market: "#38bdf8", news: "#f59e0b", community: "#a78bfa", ai: "#94a3b8" } as Record<string, string>)[c.trustLevel] || "#94a3b8" }}>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded" style={{ background: c.trustLevel === "official" ? "#10b98133" : "#94a3b833", color: c.trustLevel === "official" ? "#10b981" : "#94a3b8" }}>{c.trustLevel}</span>
                  <span className="text-slate-400">{c.docType} · {c.version}</span>
                </div>
                <div className="text-slate-200 text-sm mt-0.5">{c.title}</div>
                <div className="text-slate-500 text-xs mt-1 line-clamp-2">{c.excerpt}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {a.onChain && (
        <div className="mt-3 p-3 rounded-lg bg-indigo-900/20 border border-indigo-800/40 text-xs">
          <div className="text-indigo-300 font-semibold">链上存证</div>
          <div className="font-mono text-slate-500 text-[10px] break-all mt-1">tx: {a.onChain.txHash}</div>
          <div className="font-mono text-slate-500 text-[10px] break-all">hash: {a.onChain.evidenceHash}</div>
          <a href={`/proof?hash=${a.onChain.evidenceHash}`} className="mt-1 inline-block text-indigo-300 hover:underline">→ 验证</a>
        </div>
      )}
    </div>
  );
}
