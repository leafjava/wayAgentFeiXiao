import type { Metadata, Viewport } from "next";
import { BackgroundVideo } from "../components/BackgroundVideo";
import { ART_POSTER } from "@/config/artwork";
import { SiteShell } from "../components/SiteShell";
import "./globals.css";
import "./landing.css";
import "./workspace.css";

// Keep a single runtime layout across data-backed and client-only routes.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TokenTruth · 让投资者问得明白",
  description: "基于可验证 AI 知识库的代币尽调与沟通平台 · Monad Testnet",
};
export const viewport: Viewport = { themeColor: "#02060f", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN" className="dark">
    <head>
      <link rel="preload" href="/assets/fonts/sora-variable.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://d8j0ntlcm91z4.cloudfront.net" />
      <link rel="preconnect" href="https://d2ol7oe51mr4n9.cloudfront.net" />
      <link rel="preload" href={ART_POSTER} as="image" fetchPriority="high" />
    </head>
    <body><BackgroundVideo /><SiteShell>{children}</SiteShell></body>
  </html>;
}
