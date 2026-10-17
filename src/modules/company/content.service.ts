/** Content generator: 6 templates filled from project knowledge base. */

import type { ProjectDTO } from "@/types";

const TEMPLATES: Record<string, { title: string; structure: string[] }> = {
  intro: { title: "项目介绍", structure: ["一句话定位", "目标用户", "核心价值", "差异化"] },
  video_script: { title: "60 秒视频脚本", structure: ["开场 5 秒", "痛点 10 秒", "解决方案 25 秒", "CTA 20 秒"] },
  press_release: { title: "新闻稿模板", structure: ["标题", "副标题", "导语", "主体 3 段", "项目方 quote", "联系信息"] },
  social_x: { title: "X 推文（280 字内）", structure: ["Hook", "核心信息", "标签"] },
  social_tg: { title: "Telegram 频道帖", structure: ["标题", "正文", "CTA"] },
  faq: {
    title: "投资者 FAQ",
    structure: ["Q1: 这家公司靠什么赚钱？", "Q2: 代币有什么权利？", "Q3: 什么时候可以转让？", "Q4: 未来一年有哪些解锁？", "Q5: 当前主要风险？"],
  },
};

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, v]) => ({ key, title: v.title, structure: v.structure }));
}

function fillSection(heading: string, project: ProjectDTO): string {
  const { name, symbol, sector, description, website } = project;
  if (heading.includes("一句话定位") || heading === "Hook" || heading === "标题") {
    return `${name}（${symbol}）：${description?.slice(0, 80) || (sector || "加密项目") + "领域的项目"}。`;
  }
  if (heading.includes("目标用户")) return `面向 ${sector || "加密"} 生态的用户与开发者。`;
  if (heading.includes("核心价值") || heading.includes("解决方案")) {
    return description?.slice(0, 200) || "提供差异化能力与可持续的代币经济。";
  }
  if (heading.includes("差异化")) return `${sector || "加密"} 领域差异化定位；具体见白皮书与代币经济模型。`;
  if (heading.includes("开场") || heading.includes("痛点")) return `${sector || "加密"} 行业当前痛点：效率、信任与可持续性。`;
  if (heading === "CTA") return `访问 ${website || "官网"} 获取更多信息。`;
  if (heading === "副标题") return `${name} 在 ${sector || "加密"} 持续迭代，本期更新亮点：…`;
  if (heading === "导语") return `${name} 今日宣布…（请补充具体事件）`;
  if (heading.includes("主体") || heading.includes("项目方 quote") || heading.includes("联系信息")) return "（请项目方补充具体内容）";
  if (heading.includes("核心信息")) return `${name}（${symbol}）— ${description?.slice(0, 100) || sector || "项目"}`;
  if (heading.includes("标签")) return `#${symbol} #${sector || "TokenTruth"} #TokenTruth`;
  if (heading === "正文") return `${name} 最新动态：……（请补充）`;
  if (heading.startsWith("Q") && heading.includes(":")) return `（请项目方按知识库回答：${heading.split(":", 1)[1]?.trim()}）`;
  return "（请项目方补充）";
}

export function generate(project: ProjectDTO, templateKey: string, audience = "investor") {
  if (!TEMPLATES[templateKey]) return { error: `未知模板：${templateKey}`, availableTemplates: Object.keys(TEMPLATES) };
  const t = TEMPLATES[templateKey];
  const sections = t.structure.map((heading) => ({ heading, body: fillSection(heading, project) }));
  return {
    template: templateKey,
    title: t.title,
    audience,
    projectId: project.id,
    projectName: project.name,
    sections,
    disclaimer: "本内容为模板生成，请项目方审校后发布。",
  };
}
