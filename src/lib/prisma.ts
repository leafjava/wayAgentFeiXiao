/** Prisma singleton (avoid hot-reload connection storms). */

// IMPORTANT: this side-effect import runs FIRST (before PrismaClient is imported).
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { join } from "node:path";
loadEnv({ path: join(process.cwd(), ".env.local") });
loadEnv(); // fallback to .env

// 兜底：Next.js dev 没读到 .env.local 时也保证有 DATABASE_URL
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./data/tokentruth.db";
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
