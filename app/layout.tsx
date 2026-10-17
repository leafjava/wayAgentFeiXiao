import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenTruth · 让投资者问得明白",
  description: "基于可验证 AI 知识库的代币尽调与沟通平台 · Monad Testnet",
  themeColor: "#0b0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-bg-0 text-fg-0 antialiased">{children}</body>
    </html>
  );
}
