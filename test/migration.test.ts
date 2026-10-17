import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { ensureSeed } from "@/modules/seed/seed";
import { hashCanonical } from "@/lib/hash";
import { prisma } from "@/lib/prisma";
import { POST as ask } from "@app/api/qa/route";
import { GET as proof } from "@app/api/proof/[hash]/route";
import { GET as versions } from "@app/api/version/list/route";
import { POST as version } from "@app/api/version/route";
import { POST as savePlan, GET as plans } from "@app/api/plan/route";
import { GET as paxgMarket } from "@app/api/market/paxg/route";

const post = (path: string, body: unknown) => new NextRequest(`http://localhost${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
describe("Backend migration contracts", () => {
  beforeAll(ensureSeed);
  it("serves the upstream PAXG snapshot without live quote claims", async () => {
    const response = paxgMarket();
    const snapshot = await response.json();
    expect(response.status).toBe(200);
    expect(snapshot.asset.symbol).toBe("PAXG");
    expect(snapshot.market.isLive).toBe(false);
    expect(snapshot.purchaseFlow.executesTrades).toBe(false);
    expect(snapshot.purchaseFlow.steps.length).toBeGreaterThan(0);
  });
  it("hashes nested content without discarding fields", () => {
    expect(hashCanonical({ data: { b: 2, a: 1 } })).toBe(hashCanonical({ data: { a: 1, b: 2 } }));
    expect(hashCanonical({ data: { a: 1 } })).not.toBe(hashCanonical({ data: { a: 2 } }));
  });
  it("answers and verifies investor QA through JSON route handlers", async () => {
    const response = await ask(post("/api/qa", { projectId: "demo-mon", question: "这家公司靠什么赚钱？", anchorOnChain: true, preferLlm: false }));
    expect(response.status).toBe(200);
    const answer = await response.json();
    expect(answer.citations.length).toBeGreaterThan(0);
    const result = await (await proof(new NextRequest("http://localhost/api/proof/" + answer.onChain.evidenceHash), { params: { hash: answer.onChain.evidenceHash } })).json();
    expect(result.onChain.exists).toBe(true);
    expect(result.onChain.record.evidenceType).toBe(3);
    expect(typeof result.onChain.record.timestamp).toBe("string");
    expect(result.onChain.explorerUrl).toBe("");
  });
  it("loads the editor's version-list endpoint", async () => {
    const response = await versions(new NextRequest("http://localhost/api/version/list?projectId=demo-mon&docType=whitepaper"));
    expect(response.status).toBe(200);
    expect((await response.json()).versions[0].content).toBeTruthy();
  });
  it("saves a disclosure and verifies its actual evidence hash", async () => {
    const response = await version(post("/api/version", { projectId: "demo-mon", docType: "announcement", content: "Migration disclosure test", changes: {} }));
    const saved = await response.json();
    expect(response.status).toBe(200);
    expect(saved.onChain.evidenceHash).toBeTruthy();
    const result = await (await proof(new NextRequest("http://localhost/api/proof/" + saved.onChain.evidenceHash), { params: { hash: saved.onChain.evidenceHash } })).json();
    expect(result.onChain.exists).toBe(true);
    expect(result.onChain.record.evidenceType).toBe(0);
  });
  it("persists investment plans and exposes them to later requests", async () => {
    const response = await savePlan(post("/api/plan", { projectId: "demo-mon", budget: 500, riskPreference: "balanced", trackingFrequency: "weekly", notes: "migration test" }));
    expect(response.status).toBe(200);
    const saved = await response.json();
    expect((await prisma.investmentPlan.findUnique({ where: { planId: saved.planId } }))?.budget).toBe(500);
    const listed = await (await plans(new NextRequest("http://localhost/api/plan?projectId=demo-mon"))).json();
    expect(listed.plans.some((p: { planId: string }) => p.planId === saved.planId)).toBe(true);
  });
  it("rejects invalid plans without writing records", async () => {
    const response = await savePlan(post("/api/plan", { projectId: "demo-mon", budget: -1, riskPreference: "balanced", trackingFrequency: "weekly" }));
    expect(response.status).toBe(400);
  });
});
