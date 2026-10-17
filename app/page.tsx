import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/modules/seed/seed";
import { chainService } from "@/modules/chain/chain.service";
import { HomeView } from "../components/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  let chainMode = "mock";
  let contractAddress: `0x${string}` = "0x" as `0x${string}`;
  try {
    const s = await chainService.status();
    chainMode = s.mode;
    contractAddress = s.contractAddress;
  } catch {}
  return <HomeView projects={projects.map(toDTO)} chainMode={chainMode} contractAddress={contractAddress} />;
}

function toDTO(p: any) {
  return {
    id: p.id,
    name: p.name,
    symbol: p.symbol,
    sector: p.sector ?? "",
    description: p.description ?? "",
    category: p.category ?? "crypto",
  };
}
