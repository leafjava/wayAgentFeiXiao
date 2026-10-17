# Monad Testnet 模拟购买链上流程

## 已部署支付合约

`TokenTruthPurchase` 是一个仅用于 Monad Testnet Demo 的固定金额支付和订单记录合约。它不会铸造 PAXG，也不会代表真实资产交付；它只接收测试网 MON，并把购买者、项目 ID、资产符号和订单 ID 写入链上事件。

| 字段 | 值 |
|---|---|
| 网络 | Monad Testnet |
| Chain ID | `10143` |
| 支付金额 | `0.01 MON` |
| 合约地址 | `0xf9a49d9635d2712861cca10788da9268d2609b59` |
| 部署交易 | `0x566eed946c5ae292cac92023f13a167b3117a9b3067e548f50f1fba09d7c40a7` |

- [查看支付合约](https://testnet.monadexplorer.com/address/0xf9a49d9635d2712861cca10788da9268d2609b59)
- [查看部署交易](https://testnet.monadexplorer.com/tx/0x566eed946c5ae292cac92023f13a167b3117a9b3067e548f50f1fba09d7c40a7)

## 用户操作流程

1. 在 `/track` 选择项目和资产。
2. 点击“支付 0.01 MON 并记录”。
3. 浏览器钱包检查当前网络是否为 Monad Testnet。
4. 钱包弹出一笔固定 `0.01 MON` 的交易，用户主动确认。
5. 合约校验金额，写入 `PurchaseRecorded` 事件并生成订单 ID。
6. 页面显示交易哈希和 Monad Explorer 链接。

前端不接触私钥；交易由用户自己的 MetaMask 或兼容 EVM 钱包签名。合约没有 PAXG 铸造能力，也不把这笔测试网支付描述成真实代币交付。

## 合约接口

```solidity
uint256 public constant PRICE = 0.01 ether;

function purchase(string calldata projectId, string calldata asset)
  external payable returns (bytes32 orderId);
```

事件：

```solidity
event PurchaseRecorded(
  bytes32 indexed orderId,
  address indexed buyer,
  string projectId,
  string asset,
  uint256 amount,
  uint256 timestamp
);
```

## 合规与安全边界

- 这是 Monad Testnet 模拟购买，不是真实 PAXG 购买。
- TokenTruth 不托管用户资金，不保存私钥，不代替用户签名。
- 真实 RWA 购买仍需发行方、持牌券商或托管方完成 KYC/AML、地区和投资者资格审核。
- 页面上的“购买成功”表示测试网支付和订单记录成功，不表示用户获得了真实资产所有权。
- 合约 owner 只能提取合约收到的测试网 MON，不能修改历史订单。

## 开发者配置

在 `.env.local` 或服务器环境变量中加入：

```env
NEXT_PUBLIC_PURCHASE_CONTRACT_ADDRESS=0xf9a49d9635d2712861cca10788da9268d2609b59
```

部署或更新前端后：

```bash
npm run build
pm2 restart tokentruth
```

如果要重新部署支付合约：

```bash
npm run purchase:deploy
```

然后把新地址更新到 `NEXT_PUBLIC_PURCHASE_CONTRACT_ADDRESS`，重新构建并重启服务。
