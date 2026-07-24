import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPython } from './lib/python.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

console.log('[museum] generating 63 static pages...');
runPython(['build.py'], { cwd: root });
