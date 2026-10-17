/** viem-based Monad chain client · mock + live modes. */

import { createPublicClient, createWalletClient, http, defineChain, type Address, type Hash, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { env, isLive } from "@/config/env";
import { sha256Hex, hashCanonical, statusToBytes32 } from "@/lib/hash";

// Monad Testnet (chainId 10143) — not in viem/chains, define locally
const monadTestnet = defineChain({
  id: env.MONAD_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [env.MONAD_RPC] } },
  blockExplorers: { default: { name: "Monad Explorer", url: env.MONAD_EXPLORER } },
  testnet: true,
});

// DisclosureRegistry ABI (subset)
export const DISCLOSURE_REGISTRY_ABI = [
  {
    name: "totalEvidence",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "verify",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "evidenceHash", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      {
        name: "rec",
        type: "tuple",
        components: [
          { name: "evidenceHash", type: "bytes32" },
          { name: "evidenceId", type: "string" },
          { name: "evidenceType", type: "uint8" },
          { name: "timestamp", type: "uint256" },
          { name: "projectId", type: "string" },
          { name: "docVersion", type: "string" },
          { name: "fromStatus", type: "bytes32" },
          { name: "toStatus", type: "bytes32" },
          { name: "recorder", type: "address" },
          { name: "blockNumber", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getByEvidenceId",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "evidenceId", type: "string" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "rec", type: "tuple", components: [] },
    ],
  },
  {
    name: "recordEvidence",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "evidenceHash", type: "bytes32" },
      { name: "evidenceId", type: "string" },
      { name: "evidenceType", type: "uint8" },
      { name: "timestamp", type: "uint256" },
      { name: "projectId", type: "string" },
      { name: "docVersion", type: "string" },
      { name: "fromStatus", type: "bytes32" },
      { name: "toStatus", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export type EvidenceTypeNum = 0 | 1 | 2 | 3 | 4 | 5; // PROJECT_DISCLOSURE..EXECUTION_CONSENT
export const EVIDENCE_TYPE: Record<string, EvidenceTypeNum> = {
  PROJECT_DISCLOSURE: 0,
  RESEARCH_REPORT: 1,
  RISK_STATUS_CHANGE: 2,
  INVESTOR_QA: 3,
  CONTENT_PUBLISH: 4,
  EXECUTION_CONSENT: 5,
} as Record<string, EvidenceTypeNum>;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceTypeNum, string> = {
  0: "项目披露",
  1: "研究报告",
  2: "风险状态变更",
  3: "投资者问答",
  4: "项目方内容",
  5: "用户授权",
};

export type ChainStatus = {
  mode: "mock" | "live";
  network: string;
  latestBlock: number;
  pendingCount: number;
  contractAddress: Address;
  explorer: string;
  rpc: string;
};

export type TxResult = {
  txHash: Hash;
  blockNumber: bigint;
  status: "confirmed" | "pending" | "failed";
  error?: string;
};

// ---------------- Mock client ----------------

class MockRegistry {
  records = new Map<string, any>();
  byId = new Map<string, string>();
  blockNumber = 0n;
  txCounter = 0;

  async recordEvidence(input: RecordEvidenceInput): Promise<TxResult> {
    this.txCounter += 1;
    this.blockNumber += 1n;
    const txHash = ("0x" + ("tt" + String(this.txCounter).padStart(6, "0") + input.evidenceHash.slice(6)).padEnd(64, "0").slice(0, 64)) as Hash;
    const rec = {
      evidenceHash: input.evidenceHash,
      evidenceId: input.evidenceId,
      evidenceType: input.evidenceType,
      timestamp: BigInt(input.timestamp),
      projectId: input.projectId,
      docVersion: input.docVersion,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      recorder: "0x0000000000000000000000000000000000000TTM",
      blockNumber: this.blockNumber,
    };
    this.records.set(input.evidenceHash, rec);
    this.byId.set(input.evidenceId, input.evidenceHash);
    return { txHash, blockNumber: this.blockNumber, status: "confirmed" };
  }

  async verify(evidenceHash: Hex): Promise<{ exists: boolean; record: any }> {
    const r = this.records.get(evidenceHash);
    if (!r) return { exists: false, record: null };
    return { exists: true, record: r };
  }

  async getByEvidenceId(evidenceId: string): Promise<{ exists: boolean; record: any }> {
    const h = this.byId.get(evidenceId);
    if (!h) return { exists: false, record: null };
    const r = this.records.get(h);
    return { exists: true, record: r };
  }

  async totalEvidence(): Promise<bigint> {
    return BigInt(this.records.size);
  }

  status(contractAddress: Address): ChainStatus {
    return {
      mode: "mock",
      network: "monad-testnet",
      latestBlock: Number(this.blockNumber),
      pendingCount: 0,
      contractAddress,
      explorer: env.MONAD_EXPLORER,
      rpc: "mock://local",
    };
  }
}

// ---------------- Live client ----------------

class LiveRegistry {
  publicClient;
  walletClient?;
  account?;
  contractAddress: Address;
  contract;

  constructor() {
    this.contractAddress = (env.DISCLOSURE_REGISTRY_ADDRESS || "0x0") as Address;
    this.publicClient = createPublicClient({
      chain: { ...monadTestnet, id: env.MONAD_CHAIN_ID, rpcUrls: { default: { http: [env.MONAD_RPC] } } },
      transport: http(env.MONAD_RPC),
    });
    if (env.PRIVATE_KEY) {
      this.account = privateKeyToAccount(("0x" + env.PRIVATE_KEY.replace(/^0x/, "")) as Hex);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: { ...monadTestnet, id: env.MONAD_CHAIN_ID, rpcUrls: { default: { http: [env.MONAD_RPC] } } },
        transport: http(env.MONAD_RPC),
      });
    }
    this.contract = {
      address: this.contractAddress,
      abi: DISCLOSURE_REGISTRY_ABI,
    } as any;
  }

  async recordEvidence(input: RecordEvidenceInput): Promise<TxResult> {
    if (!this.walletClient || !this.account) {
      return { txHash: "0x" as Hash, blockNumber: 0n, status: "failed", error: "missing PRIVATE_KEY" };
    }
    try {
      const { request } = await this.publicClient.simulateContract({
        ...this.contract,
        functionName: "recordEvidence",
        args: [
          input.evidenceHash as Hex,
          input.evidenceId,
          input.evidenceType,
          BigInt(input.timestamp),
          input.projectId,
          input.docVersion,
          input.fromStatus as Hex,
          input.toStatus as Hex,
        ],
        account: this.account,
      });
      const txHash = await this.walletClient.writeContract(request);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      return {
        txHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === "success" ? "confirmed" : "failed",
      };
    } catch (e: any) {
      return { txHash: "0x" as Hash, blockNumber: 0n, status: "failed", error: e?.message ?? String(e) };
    }
  }

  async verify(evidenceHash: Hex) {
    const r: any = await this.publicClient.readContract({
      ...this.contract,
      functionName: "verify",
      args: [evidenceHash as Hex],
    });
    return { exists: r[0] as boolean, record: r[1] };
  }

  async getByEvidenceId(evidenceId: string) {
    const r: any = await this.publicClient.readContract({
      ...this.contract,
      functionName: "getByEvidenceId",
      args: [evidenceId],
    });
    return { exists: r[0] as boolean, record: r[1] };
  }

  async totalEvidence(): Promise<bigint> {
    const r: bigint = (await this.publicClient.readContract({
      ...this.contract,
      functionName: "totalEvidence",
    })) as bigint;
    return r;
  }

  status(): ChainStatus {
    return {
      mode: "live",
      network: "monad-testnet",
      latestBlock: 0,
      pendingCount: 0,
      contractAddress: this.contractAddress,
      explorer: env.MONAD_EXPLORER,
      rpc: env.MONAD_RPC,
    };
  }
}

export type RecordEvidenceInput = {
  evidenceHash: Hex;
  evidenceId: string;
  evidenceType: EvidenceTypeNum;
  timestamp: number;
  projectId: string;
  docVersion: string;
  fromStatus: Hex;
  toStatus: Hex;
};

const mockState = globalThis as unknown as { tokenTruthMockRegistry?: MockRegistry };
const mock = mockState.tokenTruthMockRegistry ?? new MockRegistry();
mockState.tokenTruthMockRegistry = mock;
const live = isLive ? new LiveRegistry() : null;

export const chain = live ?? mock;
export const contractAddress: Address = (live?.contractAddress ?? (env.DISCLOSURE_REGISTRY_ADDRESS || ("0xMOCK0000000000000000000000000000000000" as Address))) as Address;

/** High-level helper: hash a payload, then write to chain. */
export async function recordEvidenceFromPayload(
  payload: Record<string, unknown>,
  evidenceType: EvidenceTypeNum,
  opts: { evidenceId: string; projectId: string; docVersion?: string; fromStatus?: string; toStatus?: string; timestamp?: number },
): Promise<{ evidenceHash: Hex; txHash: Hash; blockNumber: bigint; status: "confirmed" | "pending" | "failed"; error?: string }> {
  const evidenceHash = hashCanonical(payload) as Hex;
  const tx = await chain.recordEvidence({
    evidenceHash,
    evidenceId: opts.evidenceId,
    evidenceType,
    timestamp: opts.timestamp ?? Math.floor(Date.now() / 1000),
    projectId: opts.projectId,
    docVersion: opts.docVersion ?? "",
    fromStatus: statusToBytes32(opts.fromStatus ?? "") as Hex,
    toStatus: statusToBytes32(opts.toStatus ?? "") as Hex,
  });
  return { evidenceHash, txHash: tx.txHash, blockNumber: tx.blockNumber, status: tx.status, error: tx.error };
}
