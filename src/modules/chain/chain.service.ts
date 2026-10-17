/** Chain service: write evidence, verify, status. */

import { prisma } from "@/lib/prisma";
import {
  chain,
  contractAddress,
  recordEvidenceFromPayload,
  EVIDENCE_TYPE,
  type EvidenceTypeNum,
  type ChainStatus,
} from "@/lib/viem";
import { hashCanonical } from "@/lib/hash";
import { env } from "@/config/env";

export class ChainService {
  contractAddress() {
    return contractAddress;
  }

  mode() {
    return env.TOKENTRUTH_CHAIN_MODE;
  }

  async status(): Promise<ChainStatus & { contractAddress: `0x${string}` }> {
    const s = (chain as any).status
      ? await (chain as any).status(contractAddress)
      : await (chain as any).status();
    return { ...s, contractAddress };
  }

  async totalEvidence(): Promise<number> {
    const t = await chain.totalEvidence();
    return Number(t);
  }

  /** Anchor a payload to the chain. Returns evidenceHash + tx info. */
  async anchor(
    payload: Record<string, unknown>,
    opts: {
      evidenceId: string;
      evidenceType: keyof typeof EVIDENCE_TYPE;
      projectId: string;
      docVersion?: string;
      fromStatus?: string;
      toStatus?: string;
    },
  ) {
    return recordEvidenceFromPayload(payload, EVIDENCE_TYPE[opts.evidenceType], opts);
  }

  async verify(evidenceHash: `0x${string}`) {
    return chain.verify(evidenceHash);
  }

  async getByEvidenceId(evidenceId: string) {
    return chain.getByEvidenceId(evidenceId);
  }
}

export const chainService = new ChainService();
