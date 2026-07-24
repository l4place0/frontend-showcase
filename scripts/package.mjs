import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');

if (relative(root, output) !== 'dist') {
  throw new Error(`拒绝清理非预期目录：${output}`);
}
if (statSync(root).isDirectory() && output !== root) {
  rmSync(output, { recursive: true, force: true });
}
mkdirSync(output, { recursive: true });

const pages = readdirSync(root)
  .filter(name => extname(name) === '.html')
  .sort();

for (const page of pages) {
  copyFileSync(join(root, page), join(output, page));
}

const digest = createHash('sha256');
for (const page of pages) digest.update(page).update('\0').update(statSync(join(root, page)).size.toString());
writeFileSync(
  join(output, 'build-meta.json'),
  JSON.stringify({
    project: 'frontend-style-museum',
    generatedAt: new Date().toISOString(),
    pages: pages.length,
    fingerprint: digest.digest('hex').slice(0, 16)
  }, null, 2) + '\n',
  'utf8'
);

console.log(`[museum] production package: dist/ (${pages.length} self-contained pages)`);
