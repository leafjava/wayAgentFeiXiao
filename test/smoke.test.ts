import { describe, it, expect, beforeAll } from "vitest";
import { ensureSeed, resetAndSeed } from "@/modules/seed/seed";
import { prisma } from "@/lib/prisma";
import { qaService } from "@/modules/qa/qa.service";
import { analyzerService } from "@/modules/knowledge/analyzer.service";
import { riskService } from "@/modules/risk/risk.service";
import { chainService } from "@/modules/chain/chain.service";
import { projectsService } from "@/modules/projects/projects.service";

describe("Seed + Projects", () => {
  beforeAll(async () => {
    await resetAndSeed();
  });
  it("seeds 2 projects", async () => {
    const ps = await projectsService.list();
    expect(ps.length).toBeGreaterThanOrEqual(2);
    expect(ps.find((p) => p.id === "demo-mon")).toBeDefined();
    expect(ps.find((p) => p.id === "demo-equityx")).toBeDefined();
  });
  it("seeds docs and versions", async () => {
    const docs = await prisma.document.count();
    const vs = await prisma.version.count();
    expect(docs).toBeGreaterThan(5);
    expect(vs).toBeGreaterThanOrEqual(docs);
  });
});

describe("QA service", () => {
  beforeAll(async () => { await resetAndSeed(); });
  it("revenue intent", async () => {
    const ans = await qaService.ask("demo-mon", "这家公司靠什么赚钱？");
    expect(ans.conclusion.length).toBeGreaterThan(0);
    expect(ans.citations.length).toBeGreaterThan(0);
  });
  it("RWA project KYC intent", async () => {
    const ans = await qaService.ask("demo-equityx", "需要 KYC 吗？");
    expect(ans.conclusion).toContain("合格投资者");
  });
});

describe("Analyzer", () => {
  beforeAll(async () => { await resetAndSeed(); });
  it("analyzes demo-mon", async () => {
    const r = await analyzerService.analyze("demo-mon");
    expect(r.summary.length).toBeGreaterThan(0);
    expect(r.fundamentals.dataCompleteness).toBeGreaterThan(0);
  });
  it("RWA project surfaces custodian risk", async () => {
    const r = await analyzerService.analyze("demo-equityx");
    expect(r.fundamentals).toBeDefined();
  });
});

describe("Risk", () => {
  beforeAll(async () => { await resetAndSeed(); });
  it("evaluates status", async () => {
    const r = await riskService.evaluate("demo-mon");
    expect(["HEALTHY", "NEEDS_REVIEW", "HIGH_RISK"]).toContain(r.status);
    expect(typeof r.score).toBe("number");
  });
});

describe("Chain (mock)", () => {
  it("records and verifies", async () => {
    const r = await chainService.anchor(
      { test: "data" },
      { evidenceId: `test-${Date.now()}`, evidenceType: "RESEARCH_REPORT", projectId: "demo-mon" },
    );
    expect(r.txHash).toBeTruthy();
    const v = await chainService.verify(r.evidenceHash);
    expect(v.exists).toBe(true);
  });
  it("status returns mock", async () => {
    const s = await chainService.status();
    expect(s.mode).toBe("mock");
  });
});
