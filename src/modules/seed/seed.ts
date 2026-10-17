/** Initial seed on app startup. Idempotent: skips if DB already has data. */

import { seedAll } from "./seed.data";

export async function ensureSeed() {
  try {
    await seedAll();
  } catch (e) {
    console.warn("[seed] failed:", (e as Error).message);
  }
}

/** Force re-seed (for tests). Wipes all data first. */
export async function resetAndSeed() {
  const { prisma } = await import("@/lib/prisma");
  await prisma.executionRecord.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.riskState.deleteMany();
  await prisma.rwaRecord.deleteMany();
  await prisma.version.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await seedAll();
}
