// 用 solc-js 编译 DisclosureRegistry.sol，无需 hardhat
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "DisclosureRegistry.sol");
const OUT_DIR = join(__dirname, "..", ".chain_runtime");
const OUT_ABI = join(OUT_DIR, "DisclosureRegistry.abi.json");
const OUT_BIN = join(OUT_DIR, "DisclosureRegistry.bin");

function findImports(path) {
  try {
    return { contents: readFileSync(path, "utf8") };
  } catch (e) {
    return { error: "File not found: " + path };
  }
}

const source = readFileSync(SRC, "utf8");
const input = {
  language: "Solidity",
  sources: { "DisclosureRegistry.sol": { content: source } },
  settings: {
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object"] },
    },
    optimizer: { enabled: true, runs: 200 },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  if (fatal.length) {
    console.error("Compile errors:");
    for (const e of fatal) console.error(e.formattedMessage);
    process.exit(1);
  }
  for (const w of output.errors) console.warn(w.formattedMessage);
}

const contract = output.contracts["DisclosureRegistry.sol"].DisclosureRegistry;
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_ABI, JSON.stringify(contract.abi, null, 2));
writeFileSync(OUT_BIN, contract.evm.bytecode.object);

console.log("✓ DisclosureRegistry compiled");
console.log("  abi:", OUT_ABI);
console.log("  bin:", OUT_BIN, `(${contract.evm.bytecode.object.length / 2} bytes)`);
