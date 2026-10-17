/** Analyzer service: 4-quadrant breakdown (fundamentals/market/community/risk). */

import { prisma } from "@/lib/prisma";
import { projectsService } from "@/modules/projects/projects.service";

export type AnalysisResult = {
  projectId: string;
  fundamentals: {
    team: { info: string }[];
    funding: { rounds: string[] };
    useCases: string[];
    dataCompleteness: number;
    latestVersion: Record<string, string>;
  };
  market: { sector: string; tier: string; exchangeListings: string[]; circulatingSupply: string; note: string };
  community: { newsCount: number; communityPostCount: number; sentiment: string; signals: { type: string; content: string; source: string; trustLevel: string }[] };
  riskFactors: { factor: string; severity: string; note: string }[];
  summary: string;
};

export class AnalyzerService {
  async analyze(projectId: string): Promise<AnalysisResult> {
    const project = await projectsService.get(projectId);
    if (!project) {
      return {
        projectId,
        fundamentals: { team: [], funding: { rounds: [] }, useCases: [], dataCompleteness: 0, latestVersion: {} },
        market: { sector: "", tier: "", exchangeListings: [], circulatingSupply: "", note: "项目不存在" },
        community: { newsCount: 0, communityPostCount: 0, sentiment: "", signals: [] },
        riskFactors: [],
        summary: "项目不存在",
      };
    }
    const docs = await projectsService.listDocuments(projectId);
    const docsByType: Record<string, any[]> = {};
    for (const d of docs) {
      docsByType[d.docType] = docsByType[d.docType] ?? [];
      docsByType[d.docType].push(d);
    }

    const expected = ["whitepaper", "tokenomics", "unlock", "announcement"];
    const coverage = expected.map((t) => docsByType[t]?.length > 0);
    const completeness = coverage.filter(Boolean).length / expected.length;

    const latestVersions: Record<string, string> = {};
    for (const t of expected) {
      const v = await projectsService.latestVersion(projectId, t);
      if (v) latestVersions[t] = v.version;
    }

    const wp = docsByType["whitepaper"]?.[0];
    const wpContent = wp?.content ?? "";
    const team = this.extractTeam(wpContent);
    const funding = this.extractFunding(wpContent);
    const useCases = this.extractUseCases(wpContent);

    const market = {
      sector: project.sector,
      tier: "Top 100 (示例)",
      exchangeListings: ["DEX (Uniswap)"],
      circulatingSupply: "62% (示例)",
      note: "MVP 演示数据；真实接入需行情 API",
    };

    const news = docsByType["news"] ?? [];
    const communityDocs = docsByType["community"] ?? [];
    const community = {
      newsCount: news.length,
      communityPostCount: communityDocs.length,
      sentiment: communityDocs.length === 0 ? "中性" : "偏积极",
      signals: news.slice(0, 3).map((d: any) => ({ type: "news", content: d.title, source: d.source, trustLevel: d.trustLevel })),
    };

    const riskFactors: { factor: string; severity: string; note: string }[] = [];
    if (!coverage[0]) riskFactors.push({ factor: "白皮书缺失", severity: "high", note: "未找到白皮书资料" });
    if (!coverage[1]) riskFactors.push({ factor: "代币经济缺失", severity: "high", note: "未找到代币经济说明" });
    if (!coverage[2]) riskFactors.push({ factor: "解锁计划缺失", severity: "medium", note: "未找到解锁计划" });
    if (completeness < 0.5) riskFactors.push({ factor: "资料完整度低", severity: "medium", note: `完整度 ${(completeness * 100).toFixed(0)}%` });
    if (team.length === 0) riskFactors.push({ factor: "团队信息缺失", severity: "medium", note: "白皮书未提及团队" });
    if (project.category.startsWith("rwa")) {
      const rwa = project.rwaInfo ?? {};
      if (!rwa.custodian) riskFactors.push({ factor: "RWA 托管人未披露", severity: "high", note: "未指定底层资产托管人" });
      if (!rwa.regulator) riskFactors.push({ factor: "监管框架未披露", severity: "high", note: "未指定监管机构" });
      if (!rwa.auditFirm) riskFactors.push({ factor: "审计机构未披露", severity: "medium", note: "未指定审计机构" });
    }

    const summary = `${project.name}（${project.symbol}）资料完整度 ${(completeness * 100).toFixed(0)}%，已收录 ${docs.length} 份资料、${Object.keys(latestVersions).length} 个版本。当前识别 ${riskFactors.length} 项风险因素。`;

    return {
      projectId,
      fundamentals: { team, funding, useCases, dataCompleteness: completeness, latestVersion: latestVersions },
      market,
      community,
      riskFactors,
      summary,
    };
  }

  private extractTeam(content: string) {
    const out: { info: string }[] = [];
    for (const line of content.split("\n")) {
      if (["团队", "Team", "Founder", "CEO"].some((k) => line.includes(k))) {
        out.push({ info: line.trim().slice(0, 200) });
      }
    }
    return out.slice(0, 5);
  }

  private extractFunding(content: string) {
    const out: string[] = [];
    for (const m of content.matchAll(/(种子|天使|Series [A-Z]|Pre-Seed|战略)[^。\n]{0,80}/g)) {
      out.push(m[0].slice(0, 120));
    }
    return { rounds: out };
  }

  private extractUseCases(content: string) {
    const out: string[] = [];
    for (const line of content.split("\n")) {
      if (["场景", "应用", "用例", "use case", "use-case"].some((k) => line.includes(k))) {
        out.push(line.trim().slice(0, 200));
      }
    }
    return out.slice(0, 5);
  }
}

export const analyzerService = new AnalyzerService();
