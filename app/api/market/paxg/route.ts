import market from "@/data/paxg-market.json";
import asset from "@/data/paxg-asset.json";
import flow from "@/data/paxg-purchase-flow.json";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ asset, market, purchaseFlow: flow });
}
