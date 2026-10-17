/** DeepSeek LLM client (OpenAI-compatible). */

import OpenAI from "openai";
import { env, llmEnabled } from "@/config/env";

export type LLMResponse = {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
};

const client = llmEnabled
  ? new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL,
      timeout: env.DEEPSEEK_TIMEOUT * 1000,
    })
  : null;

export async function chat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts: { temperature?: number; maxTokens?: number; responseFormat?: { type: "json_object" | "text" } } = {},
): Promise<LLMResponse> {
  if (!client) throw new Error("DEEPSEEK_API_KEY 未配置");
  const t0 = Date.now();
  const r = await client.chat.completions.create({
    model: env.DEEPSEEK_MODEL,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 800,
    response_format: opts.responseFormat ?? { type: "text" },
  });
  const text = r.choices[0]?.message?.content ?? "";
  return {
    text,
    model: r.model,
    promptTokens: r.usage?.prompt_tokens ?? 0,
    completionTokens: r.usage?.completion_tokens ?? 0,
    latencyMs: Date.now() - t0,
  };
}

const QA_SYSTEM_PROMPT = `你是 TokenTruth 的 AI 投研助手，专注于"让投资者问得明白、让项目方讲得清楚"。

## 工作原则
1. **只基于下方"项目资料"回答**。资料未提及的内容必须明确说"项目资料中未提及"；
2. **每条结论都要带引用**：必须用 [N] 标注引用了哪条资料，N 是资料前的编号；
3. **优先官方资料**（trustLevel=official），其次市场/新闻，最次社区观点；
4. **不确定时降低置信度**，并在 \`risks\` 中说明信息缺口或冲突；
5. **不要给投资建议**（"该买/该卖"），只解释信息；
6. **承认不知道**：缺资料就说"项目资料中未提及"，不要编造。

## 回答结构（严格 JSON）
\`\`\`json
{
  "conclusion": "直接回答问题的结论（1-2 句话）",
  "reasoning": "推理过程（说明如何从资料推导）",
  "citationIndexes": [1, 3],
  "risks": ["该答案的潜在不确定性 1", "..."],
  "confidence": "high | medium | low",
  "followups": ["建议追问 1", "建议追问 2"]
}
\`\`\`

只输出合法 JSON，不要输出其他文字、Markdown 代码块、解释。`;

export type QAContent = {
  docId: string;
  docType: string;
  title: string;
  trustLevel: string;
  source: string;
  sourceUrl: string;
  version: string;
  excerpt: string;
  content: string;
};

export function buildQAMessages(project: { name: string; symbol: string; sector: string; description: string }, question: string, contexts: QAContent[]) {
  const lines = [
    `项目：${project.name}（${project.symbol}）`,
    `赛道：${project.sector || "未披露"}`,
    `简介：${(project.description || "").slice(0, 300)}`,
    "",
    "## 项目资料（按可信度排序）",
  ];
  contexts.forEach((c, i) => {
    lines.push(`[${i + 1}] (${c.docType} · ${c.trustLevel} · ${c.version}) ${c.title}\n${(c.content || c.excerpt).slice(0, 1200)}`);
  });
  return [
    { role: "system" as const, content: QA_SYSTEM_PROMPT },
    { role: "user" as const, content: `${lines.join("\n")}\n\n## 用户问题\n${question}\n\n请按 JSON 格式回答：` },
  ];
}

/** Extract JSON from LLM text (handles markdown fences, embedded JSON, etc.). */
export function parseJsonResponse(text: string): Record<string, any> {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
  }
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    return JSON.parse(m[0]);
  } catch {
    return {};
  }
}

export function citationIndexesToDocs(indexes: number[], contexts: QAContent[]): QAContent[] {
  const out: QAContent[] = [];
  for (const i of indexes ?? []) {
    if (i >= 1 && i <= contexts.length) out.push(contexts[i - 1]);
  }
  return out;
}
