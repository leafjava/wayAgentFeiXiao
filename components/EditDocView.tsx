"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string };
const DOC_TYPES = ["whitepaper", "tokenomics", "unlock", "announcement"];

export function EditDocView({ projects, projectId, docType }: { projects: Project[]; projectId: string; docType: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/version/list?projectId=${projectId}&docType=${docType}`).then(r => r.json()).then(d => {
      if (d.versions?.[0]) setContent(d.versions[0].content);
    });
  }, [projectId, docType]);

  function setProject(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("projectId", id);
    router.push(url.toString());
  }
  function setDocType(t: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("docType", t);
    router.push(url.toString());
  }

  async function submit() {
    if (!content.trim()) { alert("内容不能为空"); return; }
    const r = await fetch("/api/version", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, docType, content, changes: {} }),
    });
    setResult(await r.json());
  }

  return (
    <div className="workspace-page">
<main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-100">编辑资料 <span className="text-slate-500 text-base">→ 新版本上链</span></h1>
        <p className="text-slate-400 text-sm">修改后系统会自动与上一版本对比、生成新版本哈希、写入 Monad。</p>

        <div className="mt-4 flex items-center gap-3 text-xs">
          <select value={projectId} onChange={(e) => setProject(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder="在此粘贴或撰写新版本内容..."
          className="mt-4 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button onClick={submit} className="mt-3 px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm">保存新版本并上链</button>

        {result && !result.error && (
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-emerald-300 font-semibold">✓ 新版本已保存并上链</div>
            <div className="mt-2 font-mono text-slate-500 text-[10px] break-all">version: {result.version}</div>
            <div className="font-mono text-slate-500 text-[10px] break-all">hash: {result.contentHash}</div>
            <div className="font-mono text-slate-500 text-[10px] break-all">tx: {result.onChain?.txHash || "-"}</div>
            <Link href={`/proof?hash=${result.onChain?.evidenceHash || result.contentHash}`} className="mt-2 inline-block text-indigo-300 hover:underline">→ 在链上验证</Link>
          </div>
        )}
      </main>
    </div>
  );
}
