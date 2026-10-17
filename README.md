# TokenTruth2 · 动态前端适配版

> **让投资者问得明白，让项目方讲得清楚** · Next.js 14 + Prisma + viem + DeepSeek
> Monad Blitz V3 @上海 参赛项目（重做版）

本版本以本仓库后端为基础，迁入 NEURAL 风格视频首页与业务页玻璃主题。站内导航采用 Next Router，背景播放器位于根布局，不随页面切换卸载。原 Python 版本作为独立备份保留。

详见 [迁移说明与验证命令](docs/migration.md)。

---

## 一句话定位

把项目资料、代币规则、市场数据、社区信息整理成可验证的 AI 知识库，投资者能直接问"这家公司靠什么赚钱？""我买的代币有什么权利？"，项目方侧辅助内容生成 + 资料管理；同时**帮客户买代币**（用户授权后对接合规平台，RWA 项目强制使用受监管券商），每次重要操作都生成哈希并锚定到 Monad Testnet。

## 技术栈（Next.js 单体）

| 维度 | 选择 |
|---|---|
| 框架 | **Next.js 14** App Router（前端 + API Route Handlers 一体） |
| 语言 | **TypeScript 严格模式** |
| ORM | **Prisma 5** + SQLite；生产数据库需按部署环境配置 |
| 链交互 | **viem 2**（替代 web3.py，更现代、TypeScript 原生） |
| LLM | **DeepSeek**（OpenAI 兼容 SDK，可降级到本地引擎） |
| UI | **React 18** + Tailwind CSS 3 + Sora 可变字体 + 视频背景 |
| 状态 | React `useState` + URL search params（无外部 store 依赖） |
| 链上合约 | **Solidity 0.8.20** + 自带 solc-js 编译 |
| 测试 | **vitest 2** |

## 4 大功能模块

1. 💬 **问得明白**（`/chat`）：11 类加密意图 + 6 类 RWA 意图；6 字段结构化答案；可选 DeepSeek
2. 📊 **帮我分析**（`/analyze`）：基本面 + 市场 + 社区 + 风险四象限
3. 📈 **跟踪执行**（`/track`）：关注列表 + 投资计划 + 帮客户买代币（含 4 个 RWA 合规券商）
4. 📢 **项目方后台**（`/company`）：6 类内容模板 + 资料编辑 + 版本 diff

## 6 种链上证据

```
PROJECT_DISCLOSURE / RESEARCH_REPORT / RISK_STATUS_CHANGE
INVESTOR_QA / CONTENT_PUBLISH / EXECUTION_CONSENT
```

## 快速开始

```bash
cd wayAgentFeiXiao
npm ci
npm run setup         # 初始化 SQLite 并写入演示资料
npm run dev           # http://localhost:4000
```

打开浏览器：

| 路径 | 作用 |
|---|---|
| `/` | 全屏动态首页 |
| `/projects` | 项目目录 + 4 大模块入口 |
| `/project/demo-mon` | 项目资料详情 |
| `/chat?projectId=demo-mon` | 投资者问答：靠什么赚钱？ |
| `/analyze?projectId=demo-equityx` | RWA 项目综合分析 |
| `/track` | 关注 + 投资计划 + 帮客户买代币 |
| `/company?projectId=demo-mon` | 项目方后台：内容生成 |
| `/edit?projectId=demo-mon&docType=whitepaper` | 编辑资料 → 新版本上链 |
| `/proof?hash=0x...` | 链上存证查询 + Explorer 跳转 |

## 测试

```bash
DATABASE_URL=file:../data/test.db npm run db:push
DATABASE_URL=file:../data/test.db TOKENTRUTH_CHAIN_MODE=mock npm test
npm run check          # tsc --noEmit 类型检查
npm run build
TOKENTRUTH_DEMO_URL=http://127.0.0.1:4000 npm run demo # 对已启动的 mock 服务验证
```

测试会重建演示数据，必须使用独立测试数据库。mock 链账本在重启时清空，SQLite 业务数据仍保留。

## 部署到 Monad Testnet

### 1. 编译合约

```bash
npm run contract:compile
# 输出 .chain_runtime/DisclosureRegistry.abi.json + .bin
```

### 2. 部署合约

```bash
# .env 填入：
PRIVATE_KEY=<64 位 hex, 不带 0x>
TOKENTRUTH_CHAIN_MODE=live
MONAD_RPC=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
MONAD_EXPLORER=https://testnet.monadexplorer.com

npm run chain:deploy
# 终端输出合约地址，提示写入 DISCLOSURE_REGISTRY_ADDRESS
```

### 3. 启动应用

```bash
export DISCLOSURE_REGISTRY_ADDRESS="0x..."
npm run dev    # 或 npm run build && npm start
```

## 配置

`.env`（参考 `.env.example`）：

| 变量 | 必填 | 说明 |
|---|---|---|
| `TOKENTRUTH_CHAIN_MODE` | ✅ | `mock` / `live` |
| `MONAD_RPC` | live | 默认 `https://testnet-rpc.monad.xyz` |
| `MONAD_CHAIN_ID` | live | 默认 `10143` |
| `PRIVATE_KEY` | live | 部署者钱包私钥（64 hex，无 0x） |
| `DISCLOSURE_REGISTRY_ADDRESS` | live | 部署后从 deploy 脚本输出 |
| `DEEPSEEK_API_KEY` | ❌ | 留空降级到本地引擎 |
| `DEEPSEEK_BASE_URL` | ❌ | 默认 `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | ❌ | 默认 `deepseek-chat` |
| `DATABASE_URL` | ❌ | 默认 `file:../data/tokentruth.db` |

## 目录结构

```
TokenTruth2/
├── app/                                # Next.js 14 App Router
│   ├── layout.tsx / page.tsx / globals.css
│   ├── [projectId]/page.tsx             # 项目详情
│   ├── chat/ analyze/ track/ company/ edit/ proof/   # 7 个页面
│   └── api/                              # 14 个 Route Handlers
│       ├── qa/ analyze/ risk/ content/ version/ ...
│       └── proof/[hash]/ chain/status/ llm/status/ ...
├── components/                          # React 客户端组件
│   ├── HomeView.tsx / ChatView.tsx / AnalyzeView.tsx
│   ├── TrackView.tsx / CompanyView.tsx
│   └── EditDocView.tsx / ProofView.tsx
├── src/
│   ├── config/env.ts                    # Zod 验证环境变量
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma 单例
│   │   ├── viem.ts                      # viem mock + live 链客户端
│   │   ├── deepseek.ts                  # DeepSeek LLM 客户端 + QA prompt
│   │   └── hash.ts                      # sha256 / canonical JSON
│   ├── types/index.ts                   # 共享 TS 类型
│   └── modules/                          # 8 大业务模块（NestJS 风格）
│       ├── qa/{qa.service,intents}.ts
│       ├── projects/projects.service.ts
│       ├── knowledge/analyzer.service.ts
│       ├── chain/chain.service.ts
│       ├── tracking/{tracking.service,platforms.constants}.ts
│       ├── company/{content.service,version-diff}.ts
│       ├── risk/risk.service.ts
│       └── seed/{seed.data,seed}.ts
├── prisma/
│   ├── schema.prisma                    # 9 张表（含持久化投资计划）
│   └── seed.ts
├── contracts/
│   ├── DisclosureRegistry.sol          # Solidity 0.8.20
│   └── compile.mjs                      # solc-js 一键编译
├── scripts/
│   └── deploy.ts                        # 部署合约到 Monad Testnet
├── test/
│   └── smoke.test.ts                    # vitest
├── data/                                 # SQLite db（runtime 写入）
├── .chain_runtime/                      # 编译产物（git ignore）
├── package.json / tsconfig.json / tailwind.config.ts
├── next.config.mjs / postcss.config.mjs / vitest.config.ts
└── README.md
```

## 边界与安全

- ❌ 不做人脸识别 / 身份追踪
- ❌ 不在低置信度 / 遮挡时伪造"违规"
- ❌ **不自动买币/卖币**——所有执行需用户明确授权
- ❌ **不托管资金**，不绕过 KYC
- ❌ **不提供投资建议**（"该买/该卖"指令）
- ✅ 仅生成"用户授权记录 + 跳转合规平台 + 链上存证"
- ✅ RWA 项目强制使用受监管券商
- ✅ 链上证据可验证、可追溯、可审计

## 文档导航

- PRD：原 [TokenTruth/docs/PRD.md](../TokenTruth/docs/PRD.md) v1.1
- 架构：`docs/architecture.md`（待写）
- 任务：`docs/tasks.md`（待写）
- 验收：`docs/acceptance.md`（待写）

## License

MIT
