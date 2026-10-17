/** Deploy DisclosureRegistry to Monad Testnet. */

import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

loadEnv();
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ABI_FILE = join(ROOT, ".chain_runtime", "DisclosureRegistry.abi.json");
const BIN_FILE = join(ROOT, ".chain_runtime", "DisclosureRegistry.bin");

const monadTestnet = defineChain({
  id: Number(process.env.MONAD_CHAIN_ID ?? 10143),
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [process.env.MONAD_RPC ?? "https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monad Explorer", url: process.env.MONAD_EXPLORER ?? "https://testnet.monadexplorer.com" } },
  testnet: true,
});

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.error("PRIVATE_KEY 未设置");
    process.exit(1);
  }
  const rpc = process.env.MONAD_RPC ?? "https://testnet-rpc.monad.xyz";
  const chainId = Number(process.env.MONAD_CHAIN_ID ?? 10143);
  const chain = monadTestnet;
  const account = privateKeyToAccount(("0x" + pk.replace(/^0x/, "")) as `0x${string}`);
  const publicClient = createPublicClient({ chain, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain, transport: http(rpc) });
  const block = await publicClient.getBlockNumber();
  console.log(`部署者 ${account.address}, 当前块高 ${block}`);

  if (!existsSync(ABI_FILE) || !existsSync(BIN_FILE)) {
    console.error("未找到编译产物；先 npm run contract:compile");
    process.exit(2);
  }
  const abi = JSON.parse(readFileSync(ABI_FILE, "utf8"));
  const bin = readFileSync(BIN_FILE, "utf8") as `0x${string}`;

  const txHash = await wallet.deployContract({ abi, bytecode: bin, args: [] });
  console.log(`部署 tx: ${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    console.error("部署失败"); process.exit(3);
  }
  const address = receipt.contractAddress!;
  console.log(`DisclosureRegistry deployed: ${address} (block ${receipt.blockNumber})`);

  mkdirSync(join(ROOT, ".chain_runtime"), { recursive: true });
  writeFileSync(join(ROOT, ".chain_runtime", "contract.json"), JSON.stringify({
    address, deployer: account.address, txHash, blockNumber: Number(receipt.blockNumber),
    chainId, rpc, abi,
    explorer: `https://testnet.monadexplorer.com/address/${address}`,
  }, null, 2));
  console.log(`\n设置环境变量: DISCLOSURE_REGISTRY_ADDRESS=${address}`);
  console.log("再运行: npm run dev");
}

main().catch((e) => { console.error(e); process.exit(99); });
