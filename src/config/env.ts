/** TokenTruth env validation (typed access, fails fast). */

import { z } from "zod";

const EnvSchema = z.object({
  TOKENTRUTH_CHAIN_MODE: z.enum(["mock", "live"]).default("mock"),
  MONAD_RPC: z.string().default("https://testnet-rpc.monad.xyz"),
  MONAD_CHAIN_ID: z.coerce.number().int().default(10143),
  MONAD_EXPLORER: z.string().default("https://testnet.monadexplorer.com"),
  PRIVATE_KEY: z.string().optional().default(""),
  DISCLOSURE_REGISTRY_ADDRESS: z.string().optional().default(""),
  DEEPSEEK_API_KEY: z.string().optional().default(""),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com/v1"),
  DEEPSEEK_MODEL: z.string().default("deepseek-chat"),
  DEEPSEEK_TIMEOUT: z.coerce.number().int().default(20),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().default("file:./data/tokentruth.db"),
});

const raw = {
  TOKENTRUTH_CHAIN_MODE: process.env.TOKENTRUTH_CHAIN_MODE,
  MONAD_RPC: process.env.MONAD_RPC,
  MONAD_CHAIN_ID: process.env.MONAD_CHAIN_ID,
  MONAD_EXPLORER: process.env.MONAD_EXPLORER,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  DISCLOSURE_REGISTRY_ADDRESS: process.env.DISCLOSURE_REGISTRY_ADDRESS,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  DEEPSEEK_TIMEOUT: process.env.DEEPSEEK_TIMEOUT,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
};

export const env = EnvSchema.parse(raw);
export type Env = z.infer<typeof EnvSchema>;

export const isLive = env.TOKENTRUTH_CHAIN_MODE === "live";
export const isMock = env.TOKENTRUTH_CHAIN_MODE === "mock";
export const llmEnabled = env.DEEPSEEK_API_KEY.length > 0;
