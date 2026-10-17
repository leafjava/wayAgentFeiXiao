/** Tracking + execution service: watchlist, plans, consent, execution_records. */

import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashCanonical } from "@/lib/hash";
import { chainService } from "@/modules/chain/chain.service";
import { findPlatform, RWA_ACTIONS, type Platform } from "./platforms.constants";
import { env } from "@/config/env";
import type { ProjectCategory } from "@/types";

function nowTs() { return Math.floor(Date.now() / 1000); }

export class TrackingService {
  // Watchlist
  async addWatch(projectId: string, note = "", budget = 0) {
    return prisma.watchlistItem.create({ data: { id: randomUUID(), projectId, note, budget, createdAt: nowTs() } });
  }
  async listWatch() {
    return prisma.watchlistItem.findMany({ orderBy: { createdAt: "desc" } });
  }
  async removeWatch(id: string) {
    try {
      await prisma.watchlistItem.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Plan (non-persisted mock; just returns summary)
  async savePlan(projectId: string, plan: { budget: number; riskPreference: string; trackingFrequency: string; notes: string }) {
    return {
      planId: randomUUID(),
      projectId,
      budget: plan.budget,
      riskPreference: plan.riskPreference,
      trackingFrequency: plan.trackingFrequency,
      notes: plan.notes,
      createdAt: nowTs(),
    };
  }

  // Consent + execution
  async requestExecution(input: {
    projectId: string;
    platform: string;
    actionType: string;
    userLabel?: string;
    amount?: string;
    category?: ProjectCategory;
  }) {
    const platform: Platform | null = findPlatform(input.platform);
    if (!platform) throw new Error(`未知平台：${input.platform}`);

    const evidencePayload = {
      projectId: input.projectId,
      platform: input.platform,
      actionType: input.actionType,
      userLabel: input.userLabel ?? "",
      amount: input.amount ?? "",
      timestamp: nowTs(),
    };
    const evidenceHash = hashCanonical(evidencePayload) as `0x${string}`;
    const consentId = randomUUID();

    const consent = await prisma.consent.create({
      data: {
        consentId,
        projectId: input.projectId,
        platform: input.platform,
        actionType: input.actionType,
        userLabel: input.userLabel ?? "",
        amount: input.amount ?? "",
        evidenceHash,
        chainStatus: "pending",
        createdAt: nowTs(),
      },
    });

    let onchain: any = undefined;
    try {
      const result = await chainService.anchor(evidencePayload, {
        evidenceId: consentId,
        evidenceType: "EXECUTION_CONSENT",
        projectId: input.projectId,
        docVersion: input.amount ?? "",
      });
      onchain = {
        evidenceHash: result.evidenceHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber.toString(),
        status: result.status,
      };
      await prisma.consent.update({
        where: { consentId },
        data: { txHash: result.txHash, blockNumber: Number(result.blockNumber), chainStatus: result.status },
      });
    } catch (e) {
      console.warn("[tracking] chain anchor failed:", (e as Error).message);
    }

    return {
      consentId,
      projectId: input.projectId,
      platform: input.platform,
      actionType: input.actionType,
      userLabel: input.userLabel ?? "",
      amount: input.amount ?? "",
      evidenceHash,
      chainStatus: onchain?.status ?? "pending",
      redirectUrl: `https://example.invalid/${input.platform}/${input.actionType}?consent=${consentId}`,
      requiresKyc: !!platform.requiresKyc,
      regulator: platform.regulator ?? "",
      warning: platform.requiresKyc ? "RWA / 受监管平台交易需完成 KYC/AML 验证后由第三方平台执行" : undefined,
      onChain: onchain,
    };
  }

  async listConsents(projectId?: string) {
    return prisma.consent.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async recordExecution(input: {
    consentId: string;
    projectId: string;
    platform: string;
    actionType: string;
    amount?: string;
    userLabel?: string;
    evidenceHash: string;
    status: string;
  }) {
    const rec = await prisma.executionRecord.create({
      data: {
        id: randomUUID(),
        consentId: input.consentId,
        projectId: input.projectId,
        platform: input.platform,
        actionType: input.actionType,
        amount: input.amount ?? "",
        userLabel: input.userLabel ?? "",
        evidenceHash: input.evidenceHash,
        status: input.status,
        createdAt: nowTs(),
      },
    });
    return rec;
  }

  async listExecutions(projectId?: string, consentId?: string) {
    return prisma.executionRecord.findMany({
      where: { ...(projectId ? { projectId } : {}), ...(consentId ? { consentId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  /** "帮客户买代币" 一站式端点：生成 consent + chain anchor + 留 execution 痕迹。 */
  async buy(input: { projectId: string; platform: string; amount: string; userLabel?: string; category: ProjectCategory }) {
    if (!input.platform) throw new Error("缺少 platform");
    if (!input.amount) throw new Error("缺少 amount");

    const platform = findPlatform(input.platform);
    if (!platform) throw new Error(`未知平台：${input.platform}`);

    if (input.category.startsWith("rwa") && platform.category !== "rwa") {
      throw new Error("RWA / 股票代币化项目必须使用合规券商平台");
    }
    if (!input.category.startsWith("rwa") && platform.category === "rwa") {
      throw new Error("合规券商平台仅供 RWA 项目使用");
    }

    const actionType = input.category.startsWith("rwa") ? "buy_rwa" : "buy";
    const consent = await this.requestExecution({
      projectId: input.projectId,
      platform: input.platform,
      actionType,
      userLabel: input.userLabel,
      amount: input.amount,
      category: input.category,
    });

    const execution = await this.recordExecution({
      consentId: consent.consentId,
      projectId: input.projectId,
      platform: input.platform,
      actionType,
      amount: input.amount,
      userLabel: input.userLabel,
      evidenceHash: consent.evidenceHash,
      status: "dispatched",
    });

    return {
      consent,
      execution,
      redirectUrl: consent.redirectUrl,
      disclaimer: input.category.startsWith("rwa")
        ? "TokenTruth 仅生成授权记录与链上存证；实际买入在第三方合规平台完成，请在该平台完成 KYC 后再继续。"
        : "TokenTruth 仅生成授权记录与链上存证；实际买入由第三方平台完成。",
    };
  }
}

export const trackingService = new TrackingService();
export { PLATFORMS, RWA_ACTIONS, findPlatform } from "./platforms.constants";
