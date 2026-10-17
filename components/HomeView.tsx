"use client";

import Link from "next/link";

type Project = { id: string; name: string; symbol: string; sector: string; description: string; category: string };

export function HomeView({
  projects,
  chainMode,
  contractAddress,
}: {
  projects: Project[];
  chainMode: string;
  contractAddress: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-100">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              <i className="fa fa-shield" />
            </span>
            TokenTruth
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-slate-400">
            <Link href="/chat" className="hover:text-slate-100">问得明白</Link>
            <Link href="/analyze" className="hover:text-slate-100">帮我分析</Link>
            <Link href="/track" className="hover:text-slate-100">跟踪执行</Link>
            <Link href="/company" className="hover:text-slate-100">项目方后台</Link>
            <Link href="/proof" className="hover:text-slate-100">链上存证</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-800/40">
              <i className="fa fa-circle text-[8px]" /> {chainMode}
            </span>
            <span className="hidden lg:inline text-slate-500 font-mono text-[10px]">{contractAddress?.slice(0, 14)}…</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <section className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/40">
            <i className="fa fa-shield" /> Monad Testnet · 可验证的 AI 知识库
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight text-slate-50">
            让投资者<span className="text-indigo-400">问得明白</span>，<br />让项目方<span className="text-purple-400">讲得清楚</span>
          </h1>
          <p className="mt-4 text-slate-400">
            基于可验证 AI 知识库的代币尽调与沟通平台。每一份回答、每一次披露、每一次风险变化都有时间戳、版本号和链上哈希。
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">4 大功能模块</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleCard href="/chat" emoji="💬" color="indigo" title="问得明白" desc="AI 知识库 + 自然语言问答：靠什么赚钱？代币有什么权利？什么时候可以转让？" />
            <ModuleCard href="/analyze" emoji="📊" color="purple" title="帮我分析" desc="整理公司基本面、新闻、市场数据、社区信息，解释变化和风险。" />
            <ModuleCard href="/track" emoji="📈" color="amber" title="跟踪执行" desc="辅助投资计划，跟踪价格与公司动态；用户授权后对接平台执行（含 4 个 RWA 合规券商）。" />
            <ModuleCard href="/company" emoji="📢" color="emerald" title="项目方后台" desc="辅助生成介绍材料、视频脚本、新闻内容；更新资料；回答用户问题。" />
          </div>
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">
              <span className="text-emerald-300 font-semibold">🆕 RWA / 股票代币化</span> · 支持 crypto / rwa_stock / rwa_bond / rwa_fund 四类项目；底层资产托管、监管框架、分红派息、赎回机制、KYC/AML、NAV 审计均可结构化问答；用户授权后通过合规券商执行。
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">项目目录</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`} className="block bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-slate-100 font-bold text-lg">
                      {p.name} <span className="text-slate-500 text-sm">${p.symbol}</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {p.sector} {p.category.startsWith("rwa") && <span className="text-emerald-300">· RWA</span>}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{p.id}</span>
                </div>
                <p className="text-slate-400 text-sm mt-3 line-clamp-2">{p.description}</p>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="col-span-2 text-slate-500 text-sm">暂无项目，访问 <code>/api/seed</code> 灌入演示数据。</div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 mt-16 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-2 justify-between">
          <p>TokenTruth · 让投资者问得明白，让项目方讲得清楚 · 信息理解、证据追踪、风险解释、链上存证</p>
          <p className="font-mono">contract={contractAddress}</p>
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({ href, emoji, color, title, desc }: { href: string; emoji: string; color: string; title: string; desc: string }) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-900/40 border-indigo-800/40 hover:border-indigo-500",
    purple: "from-purple-900/40 border-purple-800/40 hover:border-purple-500",
    amber: "from-amber-900/40 border-amber-800/40 hover:border-amber-500",
    emerald: "from-emerald-900/40 border-emerald-800/40 hover:border-emerald-500",
  };
  return (
    <Link href={href} className={`block bg-gradient-to-br ${colorMap[color]} to-slate-900/70 border rounded-2xl p-5 transition`}>
      <div className="text-2xl">{emoji}</div>
      <h3 className="text-slate-100 font-semibold mt-3">{title}</h3>
      <p className="text-slate-400 text-xs mt-2">{desc}</p>
    </Link>
  );
}
