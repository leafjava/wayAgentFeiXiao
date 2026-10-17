/** RWA / crypto platform catalog + action classification. */

export type PlatformCategory = "dex" | "cex" | "rwa";

export type Platform = {
  id: string;
  name: string;
  category: PlatformCategory;
  supportedActions: string[];
  requiresKyc?: boolean;
  regulator?: string;
};

export const PLATFORMS: Platform[] = [
  { id: "uniswap", name: "Uniswap (DEX)", category: "dex", supportedActions: ["swap", "add_liquidity", "remove_liquidity"] },
  { id: "okx", name: "OKX (CEX)", category: "cex", supportedActions: ["buy", "sell", "subscribe"] },
  { id: "binance", name: "Binance (CEX)", category: "cex", supportedActions: ["buy", "sell", "subscribe"] },
  { id: "bybit", name: "Bybit (CEX)", category: "cex", supportedActions: ["buy", "sell", "subscribe"] },
  { id: "licensed_broker_us", name: "US Licensed Broker (SEC Reg.)", category: "rwa",
    supportedActions: ["buy_rwa", "sell", "redeem_rwa", "claim_dividend"],
    requiresKyc: true, regulator: "SEC (US)" },
  { id: "licensed_broker_eu", name: "EU Licensed Broker (MiFID)", category: "rwa",
    supportedActions: ["buy_rwa", "sell", "redeem_rwa", "claim_dividend"],
    requiresKyc: true, regulator: "ESMA / FCA" },
  { id: "rwa_marketplace", name: "RWA Marketplace", category: "rwa",
    supportedActions: ["buy_rwa", "sell", "redeem_rwa", "claim_dividend"],
    requiresKyc: true, regulator: "Varies by jurisdiction" },
  { id: "securities_platform", name: "Securities Platform", category: "rwa",
    supportedActions: ["buy_rwa", "sell", "redeem_rwa", "claim_dividend"],
    requiresKyc: true, regulator: "Varies by jurisdiction" },
];

export const RWA_ACTIONS = new Set(["buy_rwa", "redeem_rwa", "claim_dividend", "sell"]);

export function findPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id) ?? null;
}

export function platformsByCategory(category: PlatformCategory) {
  return PLATFORMS.filter((p) => p.category === category);
}
