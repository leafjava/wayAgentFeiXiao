/** Intent classification for the Q&A engine. */

export type IntentKey =
  | "revenue"
  | "token_rights"
  | "transfer_restriction"
  | "unlock_schedule"
  | "risk"
  | "team"
  | "price"
  | "use_of_funds"
  | "competitor"
  | "update"
  | "community"
  | "stock_tokenization"
  | "underlying_asset"
  | "redemption"
  | "dividend_rights"
  | "kyc_compliance"
  | "nav_audit";

export const INTENT_RULES: Array<[IntentKey, string[]]> = [
  ["revenue", ["赚钱", "收入", "revenue", "商业模式", "business model", "盈利"]],
  ["token_rights", ["代币", "权利", "token", "权利", "governance", "投票", "分红", "权益"]],
  ["transfer_restriction", ["转让", "transfer", "解锁", "unlock", "vesting", "锁仓", "限制"]],
  ["unlock_schedule", ["解锁", "vesting", "cliff", "释放", "schedule", "流通", "未来"]],
  ["risk", ["风险", "risk", "危险", "隐患", "问题"]],
  ["team", ["团队", "team", "创始人", "founder", "CEO"]],
  ["price", ["价格", "price", "上涨", "下跌", "市场", "市值", "流通"]],
  ["use_of_funds", ["资金", "funds", "用", "融资", "raised", "tier"]],
  ["competitor", ["竞品", "competitor", "对比", "类似", "compete"]],
  ["update", ["更新", "修改", "update", "change", "新增", "删除", "新版本"]],
  ["community", ["社区", "community", "Twitter", "Discord", "Telegram", "推特"]],
  ["stock_tokenization", ["股票代币", "代币化", "stock token", "tokenization", "RWA", "rwa", "资产上链", "证券代币"]],
  ["underlying_asset", ["底层资产", "underlying", "标的", "真实资产", "资产支持", "储备", "custody", "托管"]],
  ["redemption", ["赎回", "redeem", "兑换", "底层赎回", "退出", "退出机制"]],
  ["dividend_rights", ["分红", "dividend", "派息", "票息", "coupon", "利息", "收益分配"]],
  ["kyc_compliance", ["KYC", "kyc", "AML", "合规", "合规审核", "受监管", "监管", "regulator", "SEC", "MiFID", "认证投资者"]],
  ["nav_audit", ["NAV", "净值", "审计", "audit", "审计报告", "持仓报告", "财务报表"]],
];

export const INTENT_DOC_PREF: Record<IntentKey, string[]> = {
  revenue: ["whitepaper", "announcement"],
  token_rights: ["whitepaper", "tokenomics"],
  transfer_restriction: ["tokenomics", "unlock"],
  unlock_schedule: ["unlock", "tokenomics"],
  risk: ["announcement", "whitepaper", "news"],
  team: ["whitepaper", "announcement"],
  price: ["news", "community"],
  use_of_funds: ["whitepaper", "announcement"],
  competitor: ["announcement", "whitepaper"],
  update: ["whitepaper", "tokenomics", "announcement"],
  community: ["community", "news"],
  stock_tokenization: ["whitepaper", "tokenomics", "announcement"],
  underlying_asset: ["whitepaper", "announcement"],
  redemption: ["tokenomics", "whitepaper", "announcement"],
  dividend_rights: ["tokenomics", "announcement", "whitepaper"],
  kyc_compliance: ["whitepaper", "announcement", "tokenomics"],
  nav_audit: ["announcement", "whitepaper"],
};

export const TRUST_WEIGHT: Record<string, number> = {
  official: 1.0,
  market: 0.7,
  news: 0.6,
  community: 0.4,
  ai: 0.2,
};

export function detectIntents(question: string): IntentKey[] {
  const q = question.toLowerCase();
  const hits = new Set<IntentKey>();
  for (const [intent, keywords] of INTENT_RULES) {
    if (keywords.some((kw) => q.includes(kw.toLowerCase()))) hits.add(intent);
  }
  return hits.size ? Array.from(hits) : ["general" as IntentKey];
}
