/** QA service: 11 crypto + 6 RWA intents · local template + optional LLM. */

import { prisma } from "@/lib/prisma";
import { env, llmEnabled } from "@/config/env";
import { chat, buildQAMessages, parseJsonResponse, citationIndexesToDocs, type QAContent } from "@/lib/deepseek";
import type { Answer, Citation, Confidence, ProjectCategory } from "@/types";
import { detectIntents, INTENT_DOC_PREF, TRUST_WEIGHT, type IntentKey } from "./intents";

// ---- Retrieval ----

type RetrievedDoc = QAContent & { _score: number };

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[\w一-鿿]+/g) ?? []).filter((t) => t.length > 1);
}

export async function retrieveContexts(projectId: string, question: string, topK = 5): Promise<RetrievedDoc[]> {
  const intents = detectIntents(question);
  const docs = await prisma.document.findMany({ where: { projectId } });
  const versions = await prisma.version.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  const latestByType = new Map<string, typeof versions[number]>();
  for (const v of versions) {
    if (!latestByType.has(v.docType)) latestByType.set(v.docType, v);
  }

  const qTokens = new Set(tokenize(question));
  const prefTypes = new Set<string>();
  for (const intent of intents) {
    for (const t of INTENT_DOC_PREF[intent as IntentKey] ?? []) prefTypes.add(t);
  }

  const scored: RetrievedDoc[] = [];
  for (const d of docs) {
    const v = latestByType.get(d.docType);
    if (!v) continue;
    const content = v.content;
    const contentLower = content.toLowerCase();
    const matched = Array.from(qTokens).filter((t) => contentLower.includes(t)).length;
    const prefBoost = prefTypes.has(d.docType) ? 2.0 : 0.0;
    const trust = TRUST_WEIGHT[d.trustLevel] ?? 0.5;
    const score = (prefBoost + matched * 0.5) * trust;
    if (score > 0) {
      const excerpt = content.slice(0, 200).replace(/\n/g, " ").trim() + (content.length > 200 ? "..." : "");
      scored.push({
        docId: d.id,
        docType: d.docType,
        title: d.title,
        trustLevel: d.trustLevel as any,
        source: d.source ?? "",
        sourceUrl: d.sourceUrl ?? "",
        version: v.version,
        excerpt,
        content: content.slice(0, 4000),
        _score: score,
      });
    }
  }
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, topK);
}

function toCitation(c: QAContent): Citation {
  return {
    docId: c.docId,
    docType: c.docType,
    title: c.title,
    trustLevel: c.trustLevel as any,
    source: c.source,
    sourceUrl: c.sourceUrl,
    version: c.version,
    excerpt: c.excerpt,
  };
}

// ---- Local template answers ----

const FOLLOWUPS_GENERAL = [
  "这家公司靠什么赚钱？",
  "我买的代币有什么权利？",
  "未来一年有哪些解锁？",
  "这个项目当前最大的风险是什么？",
  "底层资产由谁托管？",
  "分红派息机制是什么？",
];

function tpl(args: { question: string; conclusion: string; citations: Citation[]; confidence: Confidence; risks: string[]; reasoning: string; followups: string[] }): Answer {
  return {
    question: args.question,
    conclusion: args.conclusion,
    citations: args.citations,
    confidence: args.confidence,
    risks: args.risks,
    reasoning: args.reasoning,
    suggestedFollowups: args.followups,
  };
}

function answerRevenue(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `${project.name}（${project.symbol}）的收入来源主要在白皮书与公告中披露。详见引用资料。`,
    citations: c,
    confidence: c[0]?.trustLevel === "official" ? "high" : "medium",
    risks: [
      "代币白皮书与公告中可能未列明全部收入来源；建议参考项目最新季度报告。",
      "收入数据若为推测，请以官方披露为准。",
    ],
    reasoning: "在白皮书与项目方公告中检索关键词（收入、商业模式、revenue），按可信度排序引用。",
    followups: ["代币有什么用途？", "代币持有人有哪些权利？"],
  });
}

function answerTokenRights(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `代币 ${project.symbol} 的持有人权利主要在白皮书与代币经济模型中定义。常见权利包括治理投票、费用折扣、生态激励、销毁分红等；具体以项目方披露为准。`,
    citations: c,
    confidence: c[0]?.trustLevel === "official" ? "high" : "medium",
    risks: [
      "白皮书条款不等于法律权利；具体权利以司法管辖区的链上合约与官方公告为准。",
      "代币权利可能随代币规则变更而调整，请关注最新版本。",
    ],
    reasoning: "在代币经济模型与白皮书中检索（治理、投票、分红、销毁等），按可信度排序。",
    followups: ["什么时候可以转让？", "未来一年有哪些解锁？"],
  });
}

function answerTransfer(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `代币 ${project.symbol} 的转让限制主要在代币经济与解锁计划中规定：通常包括 cliff 期、线性释放、锁仓期等。详情以引用资料中的最新版本为准。`,
    citations: c,
    confidence: c[0]?.trustLevel === "official" ? "high" : "medium",
    risks: [
      "链上转账可能受智能合约代码限制（如转账白名单、税率）；请同时检查合约源代码。",
      "二级市场转让限制可能因司法管辖区而异。",
    ],
    reasoning: "在代币经济与解锁计划中检索（lockup、cliff、transfer restriction、锁仓）。",
    followups: ["未来一年有哪些解锁？", "团队代币什么时候释放？"],
  });
}

function answerUnlock(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `代币 ${project.symbol} 的解锁计划记录在 unlock 类型资料中。请按时间表对照近期事件。`,
    citations: c,
    confidence: "medium",
    risks: [
      "大规模解锁可能造成短期流通量与价格压力，但仍需结合市场情绪综合判断。",
      "解锁计划可能调整，请参考最新版本与项目方公告。",
    ],
    reasoning: "在 unlock 类型资料中检索（vesting、unlock、cliff、释放）。",
    followups: ["团队代币什么时候释放？", "项目方最近修改过代币规则吗？"],
  });
}

function answerRisk(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `根据引用资料，${project.name} 当前主要风险包括：监管合规风险、合约代码风险、市场流动性风险、解锁压力。请结合项目方披露与第三方研究综合判断。`,
    citations: c,
    confidence: c.length ? "high" : "low",
    risks: [
      "本回答仅基于项目方披露资料；不构成投资建议。",
      "加密资产价格波动剧烈，请量力而行。",
    ],
    reasoning: "在所有资料中检索风险相关关键词，结合项目风险状态评分。",
    followups: ["代币有什么权利？", "未来一年有哪些解锁？"],
  });
}

function answerGeneral(project: any, c: Citation[]): Answer {
  return tpl({
    question: "",
    conclusion: `关于 ${project.name}（${project.symbol}）的这个问题，请参考以下引用资料。`,
    citations: c,
    confidence: c.length ? "medium" : "low",
    risks: ["未匹配到明确意图，建议换个问法或参考项目方原始资料。"],
    reasoning: "未检测到明确意图，按关键词匹配给出最相关资料。",
    followups: FOLLOWUPS_GENERAL,
  });
}

function answerStockTokenization(project: any, c: Citation[]): Answer {
  if (project.category !== "rwa_stock") return answerGeneral(project, c);
  const r = project.rwaInfo ?? {};
  return tpl({
    question: "",
    conclusion: `${project.name}（${project.symbol}）是 ${r.underlying_asset || "股票"} 的代币化项目。底层资产由 ${r.custodian || "待披露"} 托管，受 ${r.regulator || "待披露"} 监管。代币持有者享有底层资产的分红权和赎回权（参见引用资料）。`,
    citations: c,
    confidence: c[0]?.trustLevel === "official" ? "high" : "medium",
    risks: [
      "股票代币化项目受所在司法管辖区严格监管，投资人需满足 KYC/AML 与合格投资者要求；",
      "底层资产的真实性与托管人风险是关键；请查阅最新审计报告与 NAV 报告；",
      "代币价格可能与底层资产净值（NAV）偏离；二级市场流动性受限于合规平台。",
    ],
    reasoning: "检索股票代币化相关资料（白皮书、代币经济、公告），结合项目 RWA 元信息。",
    followups: ["底层资产由谁托管？", "分红派息机制是什么？", "如何赎回底层资产？", "KYC / 合规要求是什么？"],
  });
}

function answerUnderlyingAsset(project: any, c: Citation[]): Answer {
  const r = project.rwaInfo ?? {};
  return tpl({
    question: "",
    conclusion: `底层资产：${r.underlying_asset || "项目资料中未提及"}\n托管人：${r.custodian || "项目资料中未提及"}\n监管机构：${r.regulator || "项目资料中未提及"}\n监管框架：${r.regulatoryFramework || "项目资料中未提及"}\n审计机构：${r.auditFirm || "项目资料中未提及"}（最近一次：${r.lastAuditDate || "项目资料中未提及"}）`,
    citations: c,
    confidence: r.underlyingAsset ? "high" : "low",
    risks: [
      "底层资产的信息以最新审计报告与官方公告为准；",
      "托管人违约或破产可能导致代币无法赎回；请关注托管人信用评级与监管动态。",
    ],
    reasoning: "从项目 RWA 元数据 + 白皮书/公告/代币经济资料综合提取。",
    followups: ["如何赎回底层资产？", "审计由谁做？", "NAV 报告在哪里？"],
  });
}

function answerRedemption(project: any, c: Citation[]): Answer {
  const r = project.rwaInfo ?? {};
  return tpl({
    question: "",
    conclusion: `赎回机制：\n• 赎回期：${r.redemptionPeriodDays ?? "项目资料中未提及"} 天\n• 最低赎回额：${r.minimumRedemption || "项目资料中未提及"}\n• 赎回路径：投资人通过合规平台提交赎回申请 → 托管人审核 → 底层资产交割 → 代币销毁。\n实际赎回速度与门槛以项目方最新公告与代币合约代码为准。`,
    citations: c,
    confidence: "medium",
    risks: [
      "赎回期可能因监管要求、托管人处理时间或市场流动性而延长；",
      "二级市场转让可能快于赎回，但价格可能与 NAV 偏离；",
      "小额赎回可能受最低赎回额限制。",
    ],
    reasoning: "从 RWA 元数据 + 代币经济 / 公告中提取赎回机制。",
    followups: ["底层资产由谁托管？", "分红派息机制是什么？", "KYC / 合规要求是什么？"],
  });
}

function answerDividend(project: any, c: Citation[]): Answer {
  const r = project.rwaInfo ?? {};
  return tpl({
    question: "",
    conclusion: `分红派息机制：\n• 派息频率：${r.dividendFrequency || "项目资料中未提及"}\n• 派息来源：底层资产的现金分红 / 票息\n• 派息方式：通常按持币比例自动派发到投资人钱包（需 KYC/合规）\n具体派息记录、累计金额与税务处理请参考项目方公告与最新审计报告。`,
    citations: c,
    confidence: "medium",
    risks: [
      "代币持有人在派息时必须满足 KYC / 合规要求，否则可能无法领取；",
      "派息并非保证，取决于底层资产现金流；",
      "派息可能被视为应税事件，请咨询当地税务顾问（TokenTruth 不提供税务建议）。",
    ],
    reasoning: "从 RWA 元数据 + 代币经济 / 公告中提取派息机制。",
    followups: ["底层资产由谁托管？", "如何赎回底层资产？", "如何帮客户买代币？"],
  });
}

function answerKyc(project: any, c: Citation[]): Answer {
  const r = project.rwaInfo ?? {};
  const kyc = r.kycRequired !== false;
  const accredited = !!r.accreditedOnly;
  return tpl({
    question: "",
    conclusion: `KYC / 合规要求：\n• KYC 必须：${kyc ? "是" : "否"}\n• 仅限合格投资者：${accredited ? "是" : "否"}\n• 监管机构：${r.regulator || "项目资料中未提及"}\n• 监管框架：${r.regulatoryFramework || "项目资料中未提及"}\n\n投资人需在合规平台完成身份验证（KYC）与反洗钱（AML）检查；部分项目可能要求合格投资者资质（accredited investor）。\nTokenTruth 自身不托管资金、不绕过合规——所有执行都通过受监管的第三方平台完成。`,
    citations: c,
    confidence: kyc ? "high" : "medium",
    risks: [
      "未通过 KYC/AML 的投资人将无法买入或赎回；",
      "不同司法管辖区的合规要求可能不同；",
      "TokenTruth 仅生成授权记录与链上存证，不直接执行任何交易。",
    ],
    reasoning: "从 RWA 元数据 + 白皮书 / 公告中提取合规要求。",
    followups: ["如何赎回底层资产？", "如何帮客户买代币？"],
  });
}

const TEMPLATE_HANDLERS: Record<string, (project: any, c: Citation[]) => Answer> = {
  revenue: answerRevenue,
  token_rights: answerTokenRights,
  transfer_restriction: answerTransfer,
  unlock_schedule: answerUnlock,
  risk: answerRisk,
  general: answerGeneral,
  stock_tokenization: answerStockTokenization,
  underlying_asset: answerUnderlyingAsset,
  redemption: answerRedemption,
  dividend_rights: answerDividend,
  kyc_compliance: answerKyc,
  nav_audit: answerUnderlyingAsset,
};

async function askTemplate(project: any, question: string, contexts: RetrievedDoc[]): Promise<Answer> {
  const intents = detectIntents(question);
  const primary = intents[0] ?? "general";
  const handler = TEMPLATE_HANDLERS[primary] ?? TEMPLATE_HANDLERS.general;
  const ans = handler(project, contexts.map(toCitation));
  ans.question = question;
  return ans;
}

async function askLLM(project: any, question: string, contexts: RetrievedDoc[]): Promise<Answer> {
  const messages = buildQAMessages(
    { name: project.name, symbol: project.symbol, sector: project.sector ?? "", description: project.description ?? "" },
    question,
    contexts,
  );
  const resp = await chat(messages, { temperature: 0.2, maxTokens: 800, responseFormat: { type: "json_object" } });
  const data = parseJsonResponse(resp.text);
  if (!data) throw new Error("LLM JSON parse failed");
  const used = citationIndexesToDocs(data.citationIndexes ?? [], contexts);
  const citations = (used.length ? used : contexts).map(toCitation);
  return tpl({
    question,
    conclusion: String(data.conclusion ?? "").trim(),
    citations,
    confidence: (String(data.confidence ?? "medium").toLowerCase() as Confidence),
    risks: Array.isArray(data.risks) ? data.risks : [],
    reasoning: String(data.reasoning ?? "").trim(),
    followups: Array.isArray(data.followups) ? data.followups : [],
  });
}

// ---- Public entry ----

export class QAService {
  async ask(projectId: string, question: string, preferLLM = true): Promise<Answer & { llmUsed: boolean; llmModel: string | null }> {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return { ...tpl({ question, conclusion: `未找到项目 ${projectId}`, citations: [], confidence: "low", risks: ["项目不存在"], reasoning: "", followups: [] }), llmUsed: false, llmModel: null };
    }
    const contexts = await retrieveContexts(projectId, question);
    if (preferLLM && llmEnabled && contexts.length) {
      try {
        const ans = await askLLM(this.normalize(project), question, contexts);
        return { ...ans, llmUsed: true, llmModel: env.DEEPSEEK_MODEL };
      } catch (e) {
        console.warn("[qa] LLM failed, falling back to template:", (e as Error).message);
      }
    }
    const ans = await askTemplate(this.normalize(project), question, contexts);
    return { ...ans, llmUsed: false, llmModel: null };
  }

  private normalize(p: any) {
    return {
      ...p,
      rwaInfo: p.rwaInfoJson ? JSON.parse(p.rwaInfoJson) : {},
    };
  }
}

export const qaService = new QAService();
