"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingHero() {
  const [entered, setEntered] = useState(false);
  const [warming, setWarming] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setEntered(true), 4000); return () => clearTimeout(timer); }, []);
  useEffect(() => { if (!entered) return; const timer = setTimeout(() => setWarming(false), 250); return () => clearTimeout(timer); }, [entered]);
  return <div className={`landing-shell${entered ? " is-entered" : ""}${warming ? " is-warming" : ""}`}>


<div className="veil" aria-hidden="true"></div>
<header className="bar">
<Link className="brand" href="/" aria-label="TokenTruth 首页"><svg viewBox="0 0 23 17" aria-hidden="true"><path d="M8.15 .9 H4.55 L.5 9.3 H4.1 Z"/><path d="M17 0 H13.4 L6.15 16.4 H9.75 Z"/><path d="M22.9 0 H19.3 L15 7.6 H18.6 Z"/><path d="M22.6 6.9 H19 L14.05 16.4 H17.65 Z"/></svg><span id="word">TokenTruth</span></Link>
<input className="navtoggle" type="checkbox" id="nav-open" aria-label="打开或关闭导航菜单" aria-controls="main-navigation" />
<label className="scrim" htmlFor="nav-open" aria-hidden="true"></label>
<label className="burger" htmlFor="nav-open" aria-label="导航菜单"><svg viewBox="0 0 22 14" aria-hidden="true"><path className="b1" d="M1 1 H21"/><path className="b2" d="M1 7 H21"/><path className="b3" d="M1 13 H21"/></svg></label>
<div className="navpanel" id="main-navigation">
<nav className="menu" aria-label="主导航">
<Link href="/projects"><span id="about">项目目录</span></Link>
<Link href="/analyze"><span id="product">深度分析</span></Link>
<Link href="/track"><span id="solutions">跟踪执行</span><svg className="caret" viewBox="0 0 9 6" aria-hidden="true"><path d="M.7 1.1 L4.5 4.6 L8.3 1.1"/></svg></Link>
</nav>
<Link className="login" href="/proof"><span id="login">验证每一份链上证据</span><svg className="navarrow" viewBox="0 0 10 9" aria-hidden="true"><path d="M0 4.5 H9.1 M5.4 .9 L9.2 4.5 L5.4 8.1"/></svg></Link>
<Link className="pill" href="/company"><span id="contact">项目方后台</span></Link>
</div>
</header>
<main className="hero">
<h1 className="title"><span id="h1a">让投资者问得明白，</span><span id="h1b">让项目方讲得清楚。</span></h1>
<p className="sub"><span id="sub1">用可验证的 AI 知识库，读懂每一个代币。</span><span id="sub2">每一次回答，都有据可查。</span></p>
<Link className="cta" href="/chat"><span id="cta">开始探索真相</span><svg className="arrow" viewBox="0 0 16 11" aria-hidden="true"><path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8"/></svg></Link>
<ul className="feats" aria-label="平台功能"><li><Link href="/chat"><svg className="chev" viewBox="0 0 11 20" aria-hidden="true"><path d="M1.15 1.15 L9.6 10 L1.15 18.85"/></svg><span id="f1">有来源的 AI 问答</span></Link></li>
<li><Link href="/analyze"><svg className="chev" viewBox="0 0 11 20" aria-hidden="true"><path d="M1.15 1.15 L9.6 10 L1.15 18.85"/></svg><span id="f2">多维度项目分析</span></Link></li>
<li><Link href="/track"><svg className="chev" viewBox="0 0 11 20" aria-hidden="true"><path d="M1.15 1.15 L9.6 10 L1.15 18.85"/></svg><span id="f3">持续跟踪风险</span></Link></li>
<li><Link href="/proof"><svg className="chev" viewBox="0 0 11 20" aria-hidden="true"><path d="M1.15 1.15 L9.6 10 L1.15 18.85"/></svg><span id="f4">链上存证可验证</span></Link></li></ul>
<span className="rule" aria-hidden="true"></span>
</main>
<footer className="foot"><span id="foot1">让信任，建立在可验证的事实之上。</span><span id="foot2" onAnimationEnd={() => setEntered(true)}>TokenTruth · Monad Testnet</span></footer>

</div>;
}
