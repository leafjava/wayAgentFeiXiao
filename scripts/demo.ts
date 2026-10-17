/** E2E smoke for TokenTruth2 (replaces TokenTruth's harness). */

import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const PORT = 4011;

async function startServer() {
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, PORT: String(PORT), TOKENTRUTH_CHAIN_MODE: "mock" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  // wait for server
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/api/chain/status`);
      if (r.ok) return child;
    } catch {}
    await wait(1000);
  }
  child.kill();
  throw new Error("server failed to start");
}

async function main() {
  const steps: any[] = [];
  const child = await startServer();
  try {
    const get = async (path: string) => {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
      assert.equal(r.status, 200, `${path} ${r.status}`);
      return r.json();
    };
    const post = async (path: string, body: any) => {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      assert.equal(r.status, 200, `${path} ${r.status}`);
      return r.json();
    };

    // 1. 页面
    for (const p of ["/", "/chat", "/analyze", "/track", "/company", "/edit", "/proof"]) {
      const r = await fetch(`http://127.0.0.1:${PORT}${p}`);
      assert.equal(r.status, 200, `${p} ${r.status}`);
      steps.push({ step: `GET ${p}`, status: 200 });
    }

    // 2. 5 个核心问答
    const questions = ["这家公司靠什么赚钱？", "代币有什么权利？", "什么时候可以转让？", "未来一年有哪些解锁？", "当前主要风险？"];
    for (const q of questions) {
      const d = await post("/api/qa", { projectId: "demo-mon", question: q });
      assert.ok(d.conclusion, `qa ${q} no conclusion`);
      steps.push({ step: `qa: ${q.slice(0, 20)}`, conclusion: d.conclusion.slice(0, 50) });
    }

    // 3. 分析
    const a = await get("/api/analyze?projectId=demo-mon");
    assert.ok(a.summary, "analyze no summary");
    steps.push({ step: "analyze", summary: a.summary.slice(0, 50) });

    // 4. 风险
    const r = await get("/api/risk?projectId=demo-mon");
    assert.ok(["HEALTHY", "NEEDS_REVIEW", "HIGH_RISK"].includes(r.status), "bad risk status");
    steps.push({ step: "risk", status: r.status, score: r.score?.toFixed(1) });

    // 5. 内容生成
    const c = await post("/api/content", { projectId: "demo-mon", template: "intro" });
    assert.ok(c.sections?.length >= 1, "content no sections");
    assert.ok(c.onChain?.txHash, "content no onchain");
    steps.push({ step: "content", template: "intro", sections: c.sections.length });

    // 6. 资料更新
    const v = await post("/api/version", { projectId: "demo-mon", docType: "whitepaper", content: "## v1.1\n新内容", changes: { team: "updated" } });
    assert.ok(v.onChain?.txHash, "version no onchain");
    steps.push({ step: "version", v: v.version, tx: v.onChain.txHash.slice(0, 18) });

    // 7. 链上存证
    const p = await get(`/api/proof/${v.contentHash}`);
    assert.ok(p.onChain.exists, "proof not on chain");
    steps.push({ step: "verify proof", hash: v.contentHash.slice(0, 18) });

    // 8. 关注 + 买
    const w = await post("/api/watchlist", { projectId: "demo-mon" });
    assert.ok(w.id, "watchlist no id");
    const buys = await get("/api/stations").catch(() => null);
    const buy = await post("/api/buy", { projectId: "demo-equityx", platform: "licensed_broker_us", amount: "100 EQX" });
    assert.ok(buy.consent, "buy no consent");
    assert.ok(buy.execution, "buy no execution");
    steps.push({ step: "buy", platform: "licensed_broker_us", tx: buy.consent.onChain?.txHash?.slice(0, 18) });

    // 9. 链状态
    const s = await get("/api/chain/status");
    assert.ok(s.contractAddress, "chain no contract address");
    steps.push({ step: "chain", mode: s.mode });

    console.log(JSON.stringify({ status: "passed", steps }, null, 2));
  } finally {
    child.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
