import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));
const MAX_LINES = 150;

function isSourceFile(fileName) {
  if (!/\.(ts|tsx)$/.test(fileName)) return false;
  const base = fileName.replace(/\.tsx?$/, '');
  return !base.endsWith('.test');
}

function walk(dir, offenders) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, offenders);
    } else if (isSourceFile(entry)) {
      const count = (readFileSync(full, 'utf8').match(/\n/g) ?? []).length;
      if (count > MAX_LINES) {
        offenders.push(`${full} (${count} lines)`);
      }
    }
  }
}

const offenders = [];
walk(SRC_DIR, offenders);

if (offenders.length > 0) {
  console.error(`Source files exceeding ${MAX_LINES} lines:`);
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`Line cap OK: all source files are <= ${MAX_LINES} lines`);
