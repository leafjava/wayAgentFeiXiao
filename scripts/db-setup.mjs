import { existsSync, copyFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(resolve(root, '.env'))) copyFileSync(resolve(root, '.env.example'), resolve(root, '.env'));
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });
process.env.DATABASE_URL ||= 'file:../data/tokentruth.db';
if (process.env.DATABASE_URL.startsWith('file:')) {
  const location = decodeURIComponent(process.env.DATABASE_URL.slice(5).split('?')[0]);
  const database = resolve(root, 'prisma', location);
  mkdirSync(dirname(database), { recursive: true });
  // Prisma 5's schema engine needs the SQLite file to exist on this runtime.
  if (!existsSync(database)) closeSync(openSync(database, 'a'));
}
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/prisma/build/index.js'), 'db', 'push', '--skip-generate'], { cwd: root, env: process.env, stdio: 'inherit' });
process.exit(result.status ?? 1);
