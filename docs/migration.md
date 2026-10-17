# 后端迁移与无黑屏导航

基于 `leafjava/wayAgentFeiXiao` 的 `1dc4869e2acda9b7cec1d9cdc2cc3cc7d88eb2f8`。新版本采用 Next.js 14 App Router、TypeScript Route Handlers、Prisma 5、viem 2 和 DeepSeek 客户端；运行时不再依赖 Flask 或旧 Python 后端。

回传前同步了远端 `ad07a1a` 的 PAXG 项目与静态行情入口。上游遗漏了行情接口引用的三个 JSON 文件；已依据其种子快照补齐到受版本控制的 `src/data/`，并明确标为静态演示数据。

## 页面与背景

保留原有深色视频、海报、Sora 可变字体、玻璃按钮与全部首页入场效果。所有页面通过 `next/link` 或 Next Router 切换。`BackgroundVideo` 位于根布局，页面切换只替换内容区域，不替换视频 DOM；海报始终保留在播放器后方，页面入场动画独立播放。

背景使用两个常驻视频交替播放：提前 1 秒启动备用播放器，以 650ms 交叉淡入衔接首尾，覆盖完成后才暂停并复位上一层。备用层未就绪时保留原生循环；页面隐藏时暂停，返回后恢复。视频地址和首页入场动画保持原样。

业务页面使用同一套响应式玻璃面板。`/projects` 是项目目录，`/project/:id` 是详情；`/edit` 为新资料编辑地址，保留 `/edit_doc` 兼容入口。所有页面和业务 API 使用动态渲染，避免静态缓存冻结关注列表、链状态或资料版本。

## 必要适配

- 补齐 `/api/version/list` 和 `/api/plan`，计划通过 Prisma 持久化。
- 修正 SQLite 初始化路径，增加幂等数据库初始化与种子脚本。
- 修正链上记录中的 BigInt JSON 序列化、问答证据类型拼写和资料证据查询 hash。
- 规范化 JSON 哈希保留嵌套字段；mock 账本在同一 Node 进程内供各路由共享。
- 新仓库的业务模块和 API 是实际实现；前端直接访问同源 Next.js API，没有 Python 代理。

## 本地运行

```sh
npm ci
npm run setup
npm run dev
# 默认 http://localhost:4000
```

```sh
npm run build
npm start
```

数据库位于 `data/tokentruth.db`，`.env` 的 SQLite URL 相对于 `prisma/schema.prisma`，默认 `file:../data/tokentruth.db`。初始化不清空已有数据库。旧项目保留在相邻的 `wayAgent` 文件夹，旧 SQLite 文件未改写。

## 验证

```sh
# 测试必须使用独立数据库：测试套件会重建演示数据。
DATABASE_URL=file:../data/test.db npm run db:push
DATABASE_URL=file:../data/test.db TOKENTRUTH_CHAIN_MODE=mock npm test
npm run check
npm run build
# 对已启动的本地 mock 服务做端到端验证：
TOKENTRUTH_DEMO_URL=http://127.0.0.1:4000 npm run demo
```

默认采用 mock 链与本地问答引擎。mock 链是进程内演示账本，重启后清空，SQLite 业务数据仍保留。未配置私钥、未提交真实交易、未进行线上部署。真实链和 DeepSeek 的配置沿用上游 `.env.example`。

本仓库当前使用 SQLite。本地运行可直接使用；部署到无持久磁盘的 serverless 环境前需配置持久数据库并调整 Prisma provider，不能把本地 SQLite 当作生产数据库。
