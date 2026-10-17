"use client";

import { useEffect, useState } from "react";

const TYPE_LABEL: Record<number, string> = {
  0: "项目披露",
  1: "研究报告",
  2: "风险状态变更",
  3: "投资者问答",
  4: "项目方内容",
  5: "用户授权",
};

export function ProofView({ initialHash }: { initialHash: string }) {
  const [hash, setHash] = useState(initialHash);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { if (initialHash) lookup(initialHash); }, [initialHash]);

  async function lookup(h: string) {
    setResult({ loading: true });
    try {
      const r = await fetch(`/api/proof/${h}`);
      setResult(await r.json());
    } catch (e) {
      setResult({ error: String(e) });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/" className="text-slate-100 font-bold">TokenTruth</a>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-300 text-sm">链上存证</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-100">链上存证查询</h1>
        <p className="text-slate-400 text-sm">输入 evidenceHash 验证存证、查看链上元数据 + Explorer 跳转。</p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (hash) lookup(hash); }}
          className="mt-4 flex gap-2"
        >
          <input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="0x..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm">查询</button>
        </form>

        <div className="mt-6">
          {result?.loading ? <div className="text-slate-400 text-sm">查询中…</div> :
           result?.error ? <div className="text-rose-400 text-sm">查询失败：{result.error}</div> :
           result?.onChain?.exists ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs bg-indigo-900/30 text-indigo-300 border border-indigo-800/40">{TYPE_LABEL[result.onChain.record.evidenceType] || "其他"}</span>
                <h2 className="text-slate-100 font-bold">{result.onChain.record.projectId} · {result.onChain.record.docVersion || "-"}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Field label="evidenceId" value={result.onChain.record.evidenceId} />
                <Field label="evidenceHash" value={result.onChain.record.evidenceHash} />
                <Field label="timestamp" value={new Date(Number(result.onChain.record.timestamp) * 1000).toLocaleString()} />
                <Field label="blockNumber" value={String(result.onChain.record.blockNumber)} />
                <Field label="fromStatus" value={result.onChain.record.fromStatus} />
                <Field label="toStatus" value={result.onChain.record.toStatus} />
                <Field label="recorder" value={result.onChain.record.recorder} className="col-span-2" />
              </div>
              {result.onChain.explorerUrl && (
                <a className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs" href={result.onChain.explorerUrl} target="_blank">
                  在 Monad Explorer 打开
                </a>
              )}
            </div>
           ) : result ? (
            <div className="bg-rose-900/20 border border-rose-800/50 rounded-xl p-4 text-rose-300 text-sm">链上未找到此 evidenceHash</div>
           ) : null}
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="font-mono text-slate-200 text-xs break-all">{value}</div>
    </div>
  );
}
