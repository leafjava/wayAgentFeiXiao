/** Seed data: 2 projects (crypto + RWA) with documents/versions. */

import { projectsService } from "@/modules/projects/projects.service";
import type { ProjectDTO } from "@/types";

const DEMO_MON: ProjectDTO = {
  id: "demo-mon",
  name: "DemoChain",
  symbol: "DEMO",
  sector: "L1 公链",
  description: "DemoChain 是面向高并发场景的 EVM 兼容 Layer 1，强调并行执行与高 TPS。代币用于支付 Gas、参与治理、抵押验证。",
  website: "https://example.invalid",
  whitepaper: "https://example.invalid/whitepaper.pdf",
  category: "crypto",
  rwaInfo: {},
  createdAt: 0,
};

const DEMO_EQUITYX: ProjectDTO = {
  id: "demo-equityx",
  name: "EquityX 代币化基金",
  symbol: "EQX",
  sector: "RWA / 股票代币化",
  description: "EquityX 是合规的股票代币化平台代币，每个 EQX 代表 0.001 股某科技公司的股权。代币持有人享有底层股票的分红权和赎回权，受 SEC Reg D 506(c) 监管。",
  website: "https://example.invalid/equityx",
  whitepaper: "https://example.invalid/equityx-wp.pdf",
  category: "rwa_stock",
  rwaInfo: {
    underlying_asset: "TechCorp Inc. 普通股 (NASDAQ: TECHX)",
    custodian: "First Trust Custody (受 SEC 监管)",
    regulator: "SEC (美国证券交易委员会)",
    regulatory_framework: "Reg D 506(c) / Reg S",
    redemption_period_days: 30,
    minimum_redemption: "100 EQX",
    dividend_frequency: "季度",
    audit_firm: "Big Four Auditor (示例)",
    last_audit_date: "2026-09-30",
    nav_report_url: "https://example.invalid/equityx/nav-q3-2026.pdf",
    kyc_required: true,
    accredited_only: true,
  },
  createdAt: 0,
};

// Verified public RWA example: Paxos-issued PAX Gold (PAXG).
const PAXG: ProjectDTO = {
  id: "paxg",
  name: "Pax Gold",
  symbol: "PAXG",
  sector: "RWA / Tokenized Gold",
  description: "PAXG is a Paxos-issued ERC-20 token backed 1:1 by one fine troy ounce of London Good Delivery gold held in segregated London vaults.",
  website: "https://www.paxos.com/pax-gold",
  whitepaper: "https://www.paxos.com/wp-content/uploads/2019/09/PAX-Gold-Whitepaper.pdf",
  category: "rwa_commodity",
  rwaInfo: {
    underlying_asset: "One fine troy ounce of London Good Delivery gold per PAXG",
    issuer: "Paxos Trust Company, N.A.",
    custodian: "Paxos Trust Company; LBMA-accredited London vaults",
    regulator: "New York Department of Financial Services (Paxos Trust Company)",
    regulatory_framework: "Paxos PAX Gold Terms and Conditions; AML/KYC applies",
    representation: "Tokenized ownership interest in allocated gold; not equity in Paxos",
    dividend_rights: false,
    redemption_rights: "Redeemable through Paxos for physical gold subject to eligibility, minimums and fees",
    transferability: "Transferable on Ethereum and supported secondary markets; exchange and jurisdiction restrictions apply",
    kyc_required: true,
    accredited_only: false,
    eligibility: "Paxos account, identity verification and supported jurisdiction required for direct mint/redeem",
    risks: ["Gold price volatility", "Paxos/custody and redemption risk", "Smart-contract and blockchain risk", "Market liquidity and premium/discount risk", "Regulatory and jurisdiction restrictions"],
    contract_address: "0x45804880De22913dAFE09f4980848ECE6EcbAf78",
  },
  createdAt: 0,
};

const PAXG_DOCS = [
  { projectId: "paxg", docType: "product", title: "PAXG Overview", content: "Paxos states that each PAXG represents one fine troy ounce of London Good Delivery gold held in segregated LBMA-accredited vaults. PAXG is divisible, transferable on public blockchains and redeemable through Paxos for physical gold subject to terms.", source: "Paxos Documentation", sourceUrl: "https://docs.paxos.com/guides/stablecoin/paxg", trustLevel: "official" },
  { projectId: "paxg", docType: "whitepaper", title: "PAX Gold Whitepaper", content: "The whitepaper describes PAXG as an Ethereum ERC-20 token representing fractional ownership of corresponding London Good Delivery gold bars held by Paxos.", source: "Paxos", sourceUrl: "https://www.paxos.com/wp-content/uploads/2019/09/PAX-Gold-Whitepaper.pdf", trustLevel: "official" },
  { projectId: "paxg", docType: "terms", title: "PAX Gold Terms and Conditions", content: "Paxos terms govern account access, minting, redemption, transfer restrictions, fees, KYC/AML and risk disclosures. PAXG is not equity in Paxos and does not pay dividends.", source: "Paxos Terms", sourceUrl: "https://www.paxos.com/terms-and-conditions", trustLevel: "official" },
  { projectId: "paxg", docType: "market", title: "Static market snapshot — PAXG/USDT", content: "Snapshot date: 2026-10-17. Reference price: 4152.17 USD; 24h change: +0.82%; 24h volume: 172531972 USD; market cap: 1829493806 USD; circulating supply: 440620 PAXG; total supply: 440620 PAXG. Source: CoinMarketCap snapshot. Binance is a major PAXG/USDT secondary market.", source: "CoinMarketCap / Binance market reference", sourceUrl: "https://coinmarketcap.com/currencies/pax-gold/", trustLevel: "market" },
  { projectId: "paxg", docType: "redemption", title: "PAXG redemption and minimums", content: "Paxos documentation says PAXG is divisible to 18 decimals. Direct Paxos purchases have a 0.03 PAXG minimum because of the 0.02 PAXG conversion fee; there is no minimum holding amount. Physical redemption is subject to eligibility, fees and operational terms.", source: "Paxos Support", sourceUrl: "https://support.paxos.com/articles/8564225276-PAX-Gold-Minimum-Investment-Amounts", trustLevel: "official" },
  { projectId: "paxg", docType: "risk", title: "PAXG risk disclosure", content: "Key risks include gold price volatility, crypto-asset liquidity and spread risk, reliance on Paxos and its custodians, smart-contract or blockchain failure, counterparty and regulatory risk, and geographic restrictions.", source: "Paxos General Terms", sourceUrl: "https://www.paxos.com/terms-and-conditions/general-terms-and-conditions", trustLevel: "official" },
  { projectId: "paxg", docType: "transparency", title: "PAXG transparency reports", content: "Paxos publishes reserve composition and independent attestation reports for PAXG reserves. Users should review the latest report before relying on reserve coverage.", source: "Paxos Documentation", sourceUrl: "https://docs.paxos.com/guides/stablecoin/paxg", trustLevel: "official" },
];

const DEMO_MON_DOCS = [
  {
    projectId: "demo-mon",
    docType: "whitepaper",
    title: "DemoChain 白皮书 v1",
    content: `## 1. 项目概述\n\nDemoChain 是面向高并发场景的 EVM 兼容 Layer 1。团队由前 Solana 与 Polygon 工程师组成，2023 年成立，2024 年完成 2500 万美元 A 轮融资。\n\n## 2. 商业模式\n\n主要收入来源：\n- 链上 Gas 费（DEMO 计价）\n- 企业级 RPC 服务订阅\n- 跨链桥手续费\n\n## 3. 代币经济\n\nDEMO 总供应量 100 亿，分布：\n- 生态激励 35%\n- 团队 20%（4 年线性释放，1 年 cliff）\n- 投资人 18%（2 年线性释放，6 个月 cliff）\n- 基金会 15%\n- 流动性 12%\n\n## 4. 团队\n\n- CEO Alex Chen（前 Polygon 工程总监）\n- CTO Maya Liu（前 Solana 核心开发）\n- 首席科学家 Wei Zhang（MIT 计算机博士）\n\n## 5. 用例\n\n- DeFi 应用\n- GameFi 链上状态\n- 企业级资产上链`,
    source: "internal",
    sourceUrl: "https://example.invalid/whitepaper.pdf",
    trustLevel: "official",
  },
  {
    projectId: "demo-mon",
    docType: "tokenomics",
    title: "代币权利与转让限制",
    content: `## 代币权利\n\nDEMO 持有人享有以下权利：\n- 治理投票：1 DEMO = 1 票（不包含锁仓部分）\n- Gas 费折扣：持有 ≥ 1000 DEMO 享 10% 折扣\n- 验证者抵押：成为验证者需抵押 ≥ 10000 DEMO\n- 销毁分红：每季度净收入的 20% 用于销毁\n\n## 转让限制\n\n- 团队与投资人代币在 cliff 期内不可转让\n- 锁仓期通过智能合约强制执行，转账触发自动 revert\n- 二级市场流通量受 cliff 与线性释放影响\n\n## 风险\n\n- 早期解锁可能造成抛压\n- 治理攻击面随流通量上升而扩大`,
    source: "internal",
    sourceUrl: "https://example.invalid/tokenomics.md",
    trustLevel: "official",
  },
  {
    projectId: "demo-mon",
    docType: "unlock",
    title: "代币解锁计划 v1",
    content: `## 解锁时间表\n\n### 2026 Q1（未来 3 个月）\n- 团队第一期释放 5%（5000 万 DEMO）\n- 投资人第二期释放 3%（3000 万 DEMO）\n- 生态激励池释放 8%（2.8 亿 DEMO）\n\n### 2026 Q2\n- 团队第二期 5%\n- 投资人第三期 3%\n- 生态激励 8%\n\n### 2026 Q3\n- 团队第三期 5%\n- 投资人第四期 3%\n- 生态激励 8%\n\n总计未来 3 个月预计新增流通量约 3.6 亿 DEMO（占总供应量 3.6%）。`,
    source: "internal",
    sourceUrl: "https://example.invalid/unlock.md",
    trustLevel: "official",
  },
  {
    projectId: "demo-mon",
    docType: "announcement",
    title: "DemoChain 主网上线公告",
    content: "DemoChain 团队宣布主网将于 2026 年第一季度正式上线，初期支持 EVM 兼容智能合约、并行执行、亚秒级最终性。团队表示，将提供 5% 的代币用于空投与生态激励，详情见后续公告。",
    source: "official blog",
    sourceUrl: "https://example.invalid/announcement-001",
    trustLevel: "official",
  },
  {
    projectId: "demo-mon",
    docType: "news",
    title: "DemoChain 与某 Web3 钱包达成合作",
    content: "据加密媒体报道，DemoChain 团队宣布与某主流 Web3 钱包达成合作，钱包将原生支持 DEMO 代币转账与质押。合作细节未披露，但消息人士透露，合作可能涉及代币激励。",
    source: "示例加密媒体",
    sourceUrl: "https://example.invalid/news-001",
    trustLevel: "news",
  },
  {
    projectId: "demo-mon",
    docType: "community",
    title: "社区热门讨论：主网时间表",
    content: "Twitter 与 Discord 社区近期热议主网上线时间，团队核心开发者回复称代码审计已完成 80%，预计 3 月份完成。社区情绪整体偏积极，少数投资者关注早期解锁对价格的潜在影响。",
    source: "示例社交平台",
    sourceUrl: "https://example.invalid/community-001",
    trustLevel: "community",
  },
];

const DEMO_EQUITYX_DOCS = [
  {
    projectId: "demo-equityx",
    docType: "whitepaper",
    title: "EquityX 白皮书 v1.0",
    content: `## 1. 项目概述\n\nEquityX 是合规的股票代币化平台。每个 EQX 代币代表 TechCorp Inc. (NASDAQ: TECHX) 0.001 股的股权。\n\n## 2. 监管框架\n\n本项目根据美国 SEC Reg D 506(c) 发行，仅向合格投资者（Accredited Investor）开放。Reg S 同步向海外非美投资人开放。\n\n## 3. 托管人\n\n底层股票由 First Trust Custody 托管，托管人受 SEC 与 FINRA 监管，季度独立审计。\n\n## 4. 赎回机制\n\n- 最低赎回：100 EQX\n- 赎回期：30 个工作日\n\n## 5. 分红机制\n\n底层股票的现金分红按持币比例自动派发到投资人合规钱包。派息频率：季度。\n\n## 6. KYC / 合规\n\n所有投资人必须在合作的合规券商完成 KYC/AML 验证。TokenTruth 自身不托管资金、不绕过合规。`,
    source: "internal",
    sourceUrl: "https://example.invalid/equityx-wp.pdf",
    trustLevel: "official",
  },
  {
    projectId: "demo-equityx",
    docType: "tokenomics",
    title: "EQX 代币权利与转让限制",
    content: `## 代币权利\n\nEQX 持有人享有：\n- 底层股票分红权（按持币比例）\n- 赎回权（最低 100 EQX，30 个工作日）\n- 治理投票权（部分议案）\n- 信息披露权（季度审计报告、NAV 报告）\n\n## 转让限制\n\n- 仅限合格投资者（Accredited Investor）\n- 转让必须通过合规券商完成\n- 锁定期 12 个月\n- 二级市场流动性可能有限\n\n## 风险\n\n- 监管政策变化风险\n- 托管人信用风险\n- 赎回延迟风险\n- 税务合规风险`,
    source: "internal",
    sourceUrl: "https://example.invalid/equityx-tokenomics",
    trustLevel: "official",
  },
  {
    projectId: "demo-equityx",
    docType: "announcement",
    title: "EquityX 2026 Q3 派息公告",
    content: "EquityX 宣布 2026 Q3 派息：每 EQX 派发 0.012 美元现金分红。派息日期：2026-10-15。投资人需在合规券商完成 KYC 后方可领取。",
    source: "official",
    sourceUrl: "https://example.invalid/equityx/q3-2026",
    trustLevel: "official",
  },
  {
    projectId: "demo-equityx",
    docType: "nav_audit",
    title: "EquityX 2026 Q3 NAV 报告",
    content: `## 净资产价值（NAV）报告\n\n- 报告日期：2026-09-30\n- 底层股票数量：5,000,000 股 TechCorp\n- 总 NAV：5,000,000 × 145.30 美元 = 726,500,000 美元\n- 流通代币数量：5,000,000,000 EQX\n- 每 EQX NAV：0.1453 美元\n- 审计机构：Big Four Auditor (示例)`,
    source: "official",
    sourceUrl: "https://example.invalid/equityx/nav-q3-2026.pdf",
    trustLevel: "official",
  },
  {
    projectId: "demo-equityx",
    docType: "news",
    title: "SEC 加强对股票代币化项目的审查",
    content: "据报道，SEC 近期加强对 RWA / 股票代币化项目的审查，要求项目方在 Reg D 506(c) 之外提供更详细的合格投资者验证和持续披露。",
    source: "示例加密媒体",
    sourceUrl: "https://example.invalid/news-002",
    trustLevel: "news",
  },
];

export async function seedAll() {
  const existing = await projectsService.list();
  const now = Math.floor(Date.now() / 1000);
  if (!existing.some((p) => p.id === DEMO_MON.id)) { await projectsService.upsert({ ...DEMO_MON, createdAt: now }); for (const d of DEMO_MON_DOCS) await projectsService.addDocument(d); }
  if (!existing.some((p) => p.id === DEMO_EQUITYX.id)) { await projectsService.upsert({ ...DEMO_EQUITYX, createdAt: now + 1 }); for (const d of DEMO_EQUITYX_DOCS) await projectsService.addDocument(d); }
  if (!existing.some((p) => p.id === PAXG.id)) { await projectsService.upsert({ ...PAXG, createdAt: now + 2 }); for (const d of PAXG_DOCS) await projectsService.addDocument(d); }
  return { skipped: false, count: 3 };
}
