import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function managedPythonCandidates() {
  if (process.platform !== 'win32') return [];
  const versionsRoot = join(homedir(), '.workbuddy', 'binaries', 'python', 'versions');
  if (!existsSync(versionsRoot)) return [];
  return readdirSync(versionsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map(version => ({ command: join(versionsRoot, version, 'python.exe'), prefix: [] }));
}

export function findPython() {
  const configured = process.env.MUSEUM_PYTHON || process.env.PYTHON;
  const candidates = [
    ...(configured ? [{ command: configured, prefix: [] }] : []),
    ...managedPythonCandidates(),
    ...(process.platform === 'win32'
      ? [{ command: 'py', prefix: ['-3'] }, { command: 'python', prefix: [] }]
      : [{ command: 'python3', prefix: [] }, { command: 'python', prefix: [] }])
  ];

  for (const candidate of candidates) {
    const probe = spawnSync(candidate.command, [...candidate.prefix, '--version'], {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true
    });
    if (!probe.error && probe.status === 0) return candidate;
  }
  throw new Error(
    '未找到可用的 Python 3。请安装 Python 3.10+，或通过 MUSEUM_PYTHON 指定解释器路径。'
  );
}

export function runPython(args, options = {}) {
  const python = findPython();
  const result = spawnSync(python.command, [...python.prefix, ...args], {
    cwd: options.cwd,
    stdio: options.stdio || 'inherit',
    encoding: options.encoding,
    timeout: options.timeout,
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Python 命令执行失败，退出码 ${result.status}`);
  }
  return result;
}
