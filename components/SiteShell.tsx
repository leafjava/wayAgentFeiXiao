"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [["/projects", "项目目录"], ["/chat", "问得明白"], ["/analyze", "深度分析"], ["/track", "跟踪执行"], ["/company", "项目方后台"], ["/proof", "链上存证"]];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [chain, setChain] = useState<{ mode?: string; contractAddress?: string }>({});
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/chain/status", { signal: abort.signal }).then(r => r.ok ? r.json() : {}).then(setChain).catch(() => {});
    return () => abort.abort();
  }, []);
  if (path === "/") return <>{children}</>;
  return <div className="workspace">
    <div className="workspace-art" aria-hidden="true" />
    <header className="workspace-bar">
      <Link href="/" className="workspace-brand" aria-label="TokenTruth 首页">
        <img className="fxh-logo" src="/assets/img/FXH_logo.png" alt="" />
        <span>TokenTruth</span>
      </Link>
      <input className="workspace-toggle" id="workspace-nav" type="checkbox" checked={open} onChange={e => setOpen(e.target.checked)} aria-label="打开或关闭导航菜单" aria-controls="workspace-navigation" />
      <label className="workspace-scrim" htmlFor="workspace-nav" aria-hidden="true" />
      <label className="workspace-burger" htmlFor="workspace-nav" aria-label="导航菜单"><svg viewBox="0 0 22 14" aria-hidden="true"><path d="M1 1 H21"/><path d="M1 7 H21"/><path d="M1 13 H21"/></svg></label>
      <nav id="workspace-navigation" aria-label="主导航">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="workspace-status"><span>{chain.mode || "Monad Testnet"}</span></div>
    </header>
    <div className="workspace-main">{children}</div>
    <footer className="workspace-footer"><p>TokenTruth · 让信任，建立在可验证的事实之上。</p><p className="font-mono">{chain.contractAddress ? `contract=${chain.contractAddress}` : "Monad Testnet"}</p></footer>
  </div>;
}
