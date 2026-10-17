/** Risk service: HEALTHY / NEEDS_REVIEW / HIGH_RISK status engine. */

import { prisma } from "@/lib/prisma";
import { projectsService } from "@/modules/projects/projects.service";
import { chainService } from "@/modules/chain/chain.service";
import type { RiskStatus } from "@/types";

type RiskFactors = {
  disclosureRecency: number;
  unlockPressure: number;
  productProgress: number;
  marketVolatility: number;
  communitySentiment: number;
  dataConsistency: number;
  completeness: number;
};

const DEFAULTS: RiskFactors = {
  disclosureRecency: 0,
  unlockPressure: 0,
  productProgress: 0.5,
  marketVolatility: 0.3,
  communitySentiment: 0.5,
  dataConsistency: 1.0,
  completeness: 1.0,
};

const STATUS_THRESHOLD = { healthy: 70, needsReview: 50 } as const;

export class RiskService {
  async evaluate(projectId: string) {
    const docs = await projectsService.listDocuments(projectId);
    const project = await projectsService.get(projectId);
    if (!project) {
      return { projectId, status: "HIGH_RISK" as RiskStatus, score: 0, factors: { ...DEFAULTS, completeness: 0 }, note: "项目不存在" };
    }
    if (docs.length === 0) {
      return { projectId, status: "HIGH_RISK" as RiskStatus, score: 0, factors: { ...DEFAULTS, completeness: 0 }, note: "资料缺失，建议补充后重新评估" };
    }
    const now = Math.floor(Date.now() / 1000);
    const latest = docs.reduce((a: any, b: any) => (a.createdAt > b.createdAt ? a : b));
    const recencyDays = (now - latest.createdAt) / 86400;
    const disclosureRecency = Math.max(0, 1 - recencyDays / 90);

    const expected = ["whitepaper", "tokenomics", "unlock", "announcement"];
    const actual = new Set(docs.map((d: any) => d.docType));
    const completeness = expected.filter((t) => actual.has(t)).length / expected.length;

    const unlockDocs = docs.filter((d: any) => d.docType === "unlock");
    const unlockPressure = Math.min(1, unlockDocs.length * 0.5);

    const communityDocs = docs.filter((d: any) => ["community", "news"].includes(d.docType));
    const communitySentiment = Math.max(0, 1 - communityDocs.length * 0.1);

    const announcements = docs.filter((d: any) => d.docType === "announcement");
    const productProgress = Math.min(1, announcements.length * 0.3 + 0.4);

    let dataConsistency = 1.0;
    for (const t of expected) {
      const v = await projectsService.latestVersion(projectId, t);
      if (v?.changesJson) {
        try {
          const ch = JSON.parse(v.changesJson);
          if (Object.keys(ch).length > 3) {
            dataConsistency = 0.5;
            break;
          }
        } catch {}
      }
    }

    const factors: RiskFactors = {
      disclosureRecency,
      unlockPressure,
      productProgress,
      marketVolatility: 0.3,
      communitySentiment,
      dataConsistency,
      completeness,
    };

    const score =
      disclosureRecency * 30 +
      (1 - unlockPressure) * 15 +
      productProgress * 15 +
      (1 - communitySentiment) * 10 +
      dataConsistency * 15 +
      completeness * 15;

    const status: RiskStatus =
      score >= STATUS_THRESHOLD.healthy
        ? "HEALTHY"
        : score >= STATUS_THRESHOLD.needsReview
          ? "NEEDS_REVIEW"
          : "HIGH_RISK";

    const prev = await prisma.riskState.findUnique({ where: { projectId } });
    const fromStatus = prev?.status ?? "INIT";
    const changed = !prev || prev.status !== status;

    await prisma.riskState.upsert({
      where: { projectId },
      create: {
        projectId,
        status,
        score,
        factorsJson: JSON.stringify(factors),
        updatedAt: now,
      },
      update: { status, score, factorsJson: JSON.stringify(factors), updatedAt: now },
    });

    const result: any = {
      projectId,
      status,
      score,
      factors,
      fromStatus,
      changed,
      note: `综合评分 ${score.toFixed(1)}，状态 ${status}`,
    };

    if (changed) {
      try {
        const onchain = await chainService.anchor(
          { projectId, status, score, fromStatus },
          {
            evidenceId: `risk-${projectId}-${now}`,
            evidenceType: "RISK_STATUS_CHANGE",
            projectId,
            fromStatus: fromStatus,
            toStatus: status,
          },
        );
        result.onChain = {
          evidenceHash: onchain.evidenceHash,
          txHash: onchain.txHash,
          blockNumber: onchain.blockNumber.toString(),
          status: onchain.status,
        };
      } catch (e) {
        console.warn("[risk] chain anchor failed:", (e as Error).message);
      }
    }

    return result;
  }
}

export const riskService = new RiskService();
