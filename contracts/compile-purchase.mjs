import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import solc from "solc";
const root = process.cwd();
const source = readFileSync(join(root, "contracts", "TokenTruthPurchase.sol"), "utf8");
const input = { language: "Solidity", sources: { "TokenTruthPurchase.sol": { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (out.errors ?? []).filter(e => e.severity === "error");
if (errors.length) { console.error(errors.map(e => e.formattedMessage).join("\n")); process.exit(1); }
const c = out.contracts["TokenTruthPurchase.sol"].TokenTruthPurchase;
mkdirSync(join(root, ".chain_runtime"), { recursive: true });
writeFileSync(join(root, ".chain_runtime", "TokenTruthPurchase.abi.json"), JSON.stringify(c.abi, null, 2));
writeFileSync(join(root, ".chain_runtime", "TokenTruthPurchase.bin"), c.evm.bytecode.object);
console.log("TokenTruthPurchase compiled");
