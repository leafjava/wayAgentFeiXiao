"use client";

import { useEffect, useState } from "react";

type Platform = { id: string; name: string; category: string; supportedActions: string[]; requiresKyc?: boolean; regulator?: string };

export function TrackView() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [watch, setWatch] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("demo-mon");
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [buyResult, setBuyResult] = useState<any>(null);

  async function load() {
    const [p, w, c, e] = await Promise.all([
      fetch("/api/platforms").then(r => r.json()),
      fetch("/api/watchlist").then(r => r.json()),
      fetch("/api/consent").then(r => r.json()),
      fetch("/api/executions").then(r => r.json()),
    ]);
    setPlatforms(p.platforms ?? []);
    setWatch(w.items ?? []);
    setConsents(c.consents ?? []);
    setExecutions(e.executions ?? []);
    if (p.platforms?.length && !platform) setPlatform(p.platforms[0].id);
  }
  useEffect(() => { load(); }, []);

  const isRwa = projectId === "demo-equityx";
  useEffect(() => {
    const eligible = platforms.filter(p => isRwa ? p.category === "rwa" : p.category !== "rwa");
    if (eligible.length && !eligible.some(p => p.id === platform)) setPlatform(eligible[0].id);
  }, [isRwa, platforms, platform]);

  async function buy() {
    if (!amount) { alert("请输入数量"); return; }
    const r = await fetch("/api/buy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, platform, amount, userLabel: "demo-user" }),
    });
    const d = await r.json();
    setBuyResult(d);
    load();
  }

  async function addWatch() {
    const id = (document.getElementById("pid-input") as HTMLInputElement)?.value?.trim();
    if (!id) return;
    await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id }) });
    load();
  }
  async function removeWatch(id: string) {
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="workspace-page">
<main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-100">跟踪与执行</h1>
        <p className="text-slate-400 text-sm">辅助制定投资计划，跟踪价格和公司动态；用户授权后对接平台执行。</p>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-100">关注列表</h3>
            <div className="mt-3 flex gap-2">
              <input id="pid-input" placeholder="projectId (e.g. demo-mon)" className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-100" />
              <button onClick={addWatch} className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm">加入关注</button>
            </div>
            <ul className="mt-3 text-xs text-slate-400 space-y-1">
              {watch.length === 0 ? <li>暂无关注项</li> : watch.map(w => (
                <li key={w.id} className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1">
                  <span>{w.projectId}</span>
                  <button onClick={() => removeWatch(w.id)} className="text-rose-400">移除</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-100">投资计划</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <input id="ppid" placeholder="projectId" defaultValue={projectId} className="col-span-2 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100" />
              <input id="pbudget" placeholder="预算" className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100" />
              <select defaultValue="balanced" id="prisk" className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100">
                <option value="conservative">保守</option><option value="balanced">平衡</option><option value="aggressive">激进</option>
              </select>
              <select defaultValue="weekly" id="pfreq" className="col-span-2 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100">
                <option value="daily">每日</option><option value="weekly">每周</option><option value="on_event">事件触发</option>
              </select>
              <textarea id="pnotes" placeholder="备注" rows={2} className="col-span-2 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100"></textarea>
            </div>
            <button
              onClick={async () => {
                const r = await fetch("/api/plan", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    projectId: (document.getElementById("ppid") as HTMLInputElement).value,
                    budget: parseFloat((document.getElementById("pbudget") as HTMLInputElement).value || "0"),
                    riskPreference: (document.getElementById("prisk") as HTMLSelectElement).value,
                    trackingFrequency: (document.getElementById("pfreq") as HTMLSelectElement).value,
                    notes: (document.getElementById("pnotes") as HTMLTextAreaElement).value,
                  }),
                });
                const d = await r.json();
                alert(`计划已保存：${d.planId.slice(0, 12)}…`);
              }}
              className="mt-2 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >保存计划</button>
          </div>
        </div>

        <div className="mt-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-100">帮客户买代币（用户授权后）</h3>
          <p className="text-xs text-slate-500 mt-1">TokenTruth 仅生成授权记录 + 链上存证 + 跳转合规平台；RWA 项目必须使用合规券商。</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100">
              <option value="demo-mon">DemoChain (crypto)</option>
              <option value="demo-equityx">EquityX (RWA)</option>
            </select>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100">
              {platforms
                .filter((p) => isRwa ? p.category === "rwa" : p.category !== "rwa")
                .map((p) => <option key={p.id} value={p.id}>{p.name}{p.requiresKyc ? " 🔒KYC" : ""}</option>)}
            </select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="数量 (如 100 EQX)" className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-100" />
            <button onClick={buy} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white">授权并跳转</button>
          </div>
          {buyResult && (
            <div className="mt-3 bg-emerald-900/20 border border-emerald-800/40 rounded p-3 text-xs">
              {buyResult.error ? <div className="text-rose-400">{buyResult.error}</div> : (
                <>
                  <div className="text-emerald-300 font-semibold">✓ 授权记录已生成</div>
                  <div className="text-slate-400 mt-1">{buyResult.disclaimer}</div>
                  <div className="font-mono text-[10px] text-slate-500 break-all mt-1">execution: {buyResult.execution?.id}</div>
                  <div className="font-mono text-[10px] text-slate-500 break-all">tx: {buyResult.consent?.onChain?.txHash}</div>
                  <a href={buyResult.redirectUrl} target="_blank" className="mt-1 inline-block text-indigo-300 hover:underline">跳转 {platform} →</a>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-100">执行记录</h3>
          <ul className="mt-3 text-xs text-slate-400 space-y-1">
            {executions.length === 0 ? <li>暂无执行记录</li> : executions.map((e) => (
              <li key={e.id} className="bg-slate-800/50 rounded px-2 py-1">
                <div className="flex items-center justify-between">
                  <span>{e.projectId} · {e.platform} · {e.actionType} · {e.amount}</span>
                  <span className="text-[10px] text-slate-500">{new Date(e.createdAt * 1000).toLocaleTimeString()}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 break-all">tx: {e.txHash || "-"}</div>
                <div className="text-[10px] text-slate-400">status: {e.status}</div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
