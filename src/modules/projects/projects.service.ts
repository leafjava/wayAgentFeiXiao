/** Projects service: CRUD + versioned docs. */

import { prisma } from "@/lib/prisma";
import { hashText } from "@/lib/hash";
import type { ProjectCategory, ProjectDTO } from "@/types";

function toDTO(p: any): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    symbol: p.symbol,
    sector: p.sector ?? "",
    description: p.description ?? "",
    website: p.website ?? "",
    whitepaper: p.whitepaper ?? "",
    category: (p.category ?? "crypto") as ProjectCategory,
    rwaInfo: p.rwaInfoJson ? JSON.parse(p.rwaInfoJson) : {},
    createdAt: p.createdAt,
  };
}

export class ProjectsService {
  async list(): Promise<ProjectDTO[]> {
    const rows = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toDTO);
  }

  async get(projectId: string): Promise<ProjectDTO | null> {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    return p ? toDTO(p) : null;
  }

  async upsert(input: ProjectDTO): Promise<ProjectDTO> {
    const p = await prisma.project.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        name: input.name,
        symbol: input.symbol,
        sector: input.sector,
        description: input.description,
        website: input.website,
        whitepaper: input.whitepaper,
        category: input.category,
        rwaInfoJson: JSON.stringify(input.rwaInfo ?? {}),
        createdAt: input.createdAt,
      },
      update: {
        name: input.name,
        symbol: input.symbol,
        sector: input.sector,
        description: input.description,
        website: input.website,
        whitepaper: input.whitepaper,
        category: input.category,
        rwaInfoJson: JSON.stringify(input.rwaInfo ?? {}),
      },
    });
    return toDTO(p);
  }

  async addDocument(input: { projectId: string; docType: string; title: string; content: string; source?: string; sourceUrl?: string; trustLevel?: string }) {
    const id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const doc = await prisma.document.create({
      data: {
        id,
        projectId: input.projectId,
        docType: input.docType,
        title: input.title,
        content: input.content,
        source: input.source ?? "internal",
        sourceUrl: input.sourceUrl ?? "",
        trustLevel: input.trustLevel ?? "official",
        createdAt: Math.floor(Date.now() / 1000),
      },
    });
    // 同时自动创建初始 v1.0 版本（QA 引擎基于 versions 表检索）
    await prisma.version.create({
      data: {
        id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + "v"),
        projectId: input.projectId,
        docType: input.docType,
        version: "v1.0",
        contentHash: hashText(input.content.slice(0, 64)),
        content: input.content,
        parentVersion: null,
        changesJson: "{}",
        createdAt: Math.floor(Date.now() / 1000),
      },
    });
    return doc;
  }

  async listDocuments(projectId: string, docType?: string) {
    return prisma.document.findMany({
      where: { projectId, ...(docType ? { docType } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  async listVersions(projectId: string, docType: string) {
    return prisma.version.findMany({ where: { projectId, docType }, orderBy: { createdAt: "desc" } });
  }

  async latestVersion(projectId: string, docType: string) {
    return prisma.version.findFirst({ where: { projectId, docType }, orderBy: { createdAt: "desc" } });
  }
}

export const projectsService = new ProjectsService();
