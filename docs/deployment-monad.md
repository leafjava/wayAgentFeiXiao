# TokenTruth Monad Testnet 合约部署记录

## 部署状态

`DisclosureRegistry` 已成功部署到 **Monad Testnet**，用于 TokenTruth 的链上证据存证和查证。

| 字段 | 值 |
|---|---|
| 网络 | Monad Testnet |
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| 区块浏览器 | [Monad Explorer](https://testnet.monadexplorer.com) |
| 合约 | `DisclosureRegistry` |
| 合约地址 | `0x4a03b5707eebfc88f56f6e6a99b5d98466b31c94` |
| 部署账户 | `0x7598b2f89798DF9c7aA399bC71b899b0D35F8430` |
| 部署区块 | `71782134` |
| 部署交易 | `0x4aec5050d39446c1c5e1e4bb1a851de632940137c1f680f64ccb87d024acd32c` |
| 部署时间 | 2026-10-17 |

## 公开查看链接

- [查看合约地址](https://testnet.monadexplorer.com/address/0x4a03b5707eebfc88f56f6e6a99b5d98466b31c94)
- [查看部署交易](https://testnet.monadexplorer.com/tx/0x4aec5050d39446c1c5e1e4bb1a851de632940137c1f680f64ccb87d024acd32c)

评委可以直接打开合约链接，查看合约地址、部署账户、区块高度和链上交易状态。

## 合约用途

`DisclosureRegistry` 是 TokenTruth 的证据注册表。它不托管用户资产，也不是交易合约。系统先在本地对资料或操作内容生成规范化哈希，再把哈希和必要的元数据写入链上。

当前证据类型包括：

```text
PROJECT_DISCLOSURE
RESEARCH_REPORT
RISK_STATUS_CHANGE
INVESTOR_QA
CONTENT_PUBLISH
EXECUTION_CONSENT
```

合约主要支持：

- `recordEvidence(...)`：记录一条证据哈希；
- `verify(bytes32 evidenceHash)`：按哈希查证证据；
- `getByEvidenceId(string evidenceId)`：按业务 ID 查询证据；
- `totalEvidence()`：查询已经登记的证据数量。

## 它在产品中解决什么问题

链上记录用于证明：

1. 某份披露或问答在某个时间点已经存在；
2. 资料版本在之后没有被悄悄替换；
3. 用户在购买前确认过风险和执行授权；
4. 项目方、投资者和评委可以独立复核记录。

链上只保存哈希和必要元数据，不保存私钥、身份证、API Key、完整问答或其他敏感信息。链上哈希不能单独证明底层资产真实，也不能替代审计、监管或法律判断。

## 项目环境配置

在服务器 `.env` 或 `.env.local` 中配置：

```env
TOKENTRUTH_CHAIN_MODE=live
MONAD_RPC=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
MONAD_EXPLORER=https://testnet.monadexplorer.com
PRIVATE_KEY=部署钱包私钥
DISCLOSURE_REGISTRY_ADDRESS=0x4a03b5707eebfc88f56f6e6a99b5d98466b31c94
```

`PRIVATE_KEY` 只放在服务器环境变量中，不能提交到 Git、前端代码或文档中。

## 开发者验证步骤

安装依赖并构建：

```bash
npm install
npm run build
```

检查链状态：

```bash
curl http://127.0.0.1:3000/api/chain/status
```

Live 模式应返回类似：

```json
{
  "mode": "live",
  "network": "monad-testnet",
  "contractAddress": "0x4a03b5707eebfc88f56f6e6a99b5d98466b31c94"
}
```

如果需要重新部署：

```bash
npm run contract:compile
npm run chain:deploy
```

重新部署后必须把新的合约地址更新到 `DISCLOSURE_REGISTRY_ADDRESS`，然后重新构建并重启服务：

```bash
npm run build
pm2 restart tokentruth
```

## 评委展示流程

1. 打开 TokenTruth 的项目资料或 PAXG 页面；
2. 提交一条研究报告、风险变化或投资者问答；
3. 展示系统生成的证据哈希和交易哈希；
4. 点击“在 Monad Explorer 打开”；
5. 在浏览器中展示相同的合约地址、部署账户和链上交易；
6. 说明任何人都可以用证据原文重新计算哈希并调用 `verify` 进行查证。

## 安全和演示边界

- 当前部署在测试网，不涉及真实资金；
- 合约只做证据存证，不做资产托管和自动交易；
- 用户购买流程默认是 Mock 或 Monad Testnet 模式；
- 真实 RWA 交易仍需发行方、券商或托管方执行 KYC/AML 和地区资格审核；
- 部署账户私钥不会写入仓库，评委只需要查看公开合约地址和交易。
