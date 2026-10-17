/** Initial seed on app startup. Idempotent: skips if DB already has data. */

import { seedAll } from "./seed.data";

const seedState = globalThis as unknown as { tokenTruthSeeding?: Promise<unknown> };
export async function ensureSeed() {
  if (!seedState.tokenTruthSeeding) {
    seedState.tokenTruthSeeding = seedAll().finally(() => { seedState.tokenTruthSeeding = undefined; });
  }
  await seedState.tokenTruthSeeding;
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
