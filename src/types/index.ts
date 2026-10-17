/** Domain types shared across modules. */

export type Severity = "low" | "medium" | "high" | "critical";

export type EvidenceType =
  | "PROJECT_DISCLOSURE"
  | "RESEARCH_REPORT"
  | "RISK_STATUS_CHANGE"
  | "INVESTOR_QA"
  | "CONTENT_PUBLISH"
  | "EXECUTION_CONSENT";

export type ProjectCategory = "crypto" | "rwa_stock" | "rwa_bond" | "rwa_fund" | "other";

export type RiskStatus = "HEALTHY" | "NEEDS_REVIEW" | "HIGH_RISK";

export type TrustLevel = "official" | "market" | "news" | "community" | "ai";

export type Confidence = "low" | "medium" | "high";

export type Citation = {
  docId: string;
  docType: string;
  title: string;
  trustLevel: TrustLevel;
  source: string;
  sourceUrl: string;
  version: string;
  excerpt: string;
};

export type Answer = {
  question: string;
  conclusion: string;
  citations: Citation[];
  confidence: Confidence;
  risks: string[];
  reasoning: string;
  suggestedFollowups: string[];
};

export type ProjectDTO = {
  id: string;
  name: string;
  symbol: string;
  sector: string;
  description: string;
  website: string;
  whitepaper: string;
  category: ProjectCategory;
  rwaInfo: Record<string, any>;
  createdAt: number;
};
