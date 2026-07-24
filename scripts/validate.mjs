import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(scriptPath), '..');

function filesIn(directory, extension) {
  return readdirSync(directory)
    .filter(name => extname(name) === extension)
    .map(name => join(directory, name));
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function localLinks(html) {
  return [...html.matchAll(/\bhref=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(href =>
      !href.startsWith('#') &&
      !href.startsWith('http:') &&
      !href.startsWith('https:') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:')
    )
    .map(href => decodeURIComponent(href.split('#')[0].split('?')[0]))
    .filter(Boolean);
}

export function validateMuseum(projectRoot = root) {
  const htmlFiles = filesIn(projectRoot, '.html');
  const themeFiles = filesIn(join(projectRoot, 'src', 'themes'), '.css');
  const layoutFiles = filesIn(join(projectRoot, 'src', 'layouts'), '.css');
  const layoutPages = htmlFiles.filter(file => basename(file).startsWith('layout-'));
  const cabinetPages = new Set(['index.html', 'styles.html', 'layouts.html']);
  const stylePages = htmlFiles.filter(file =>
    !cabinetPages.has(basename(file)) && !basename(file).startsWith('layout-')
  );

  assert(htmlFiles.length === 63, `应生成 63 个 HTML，实际为 ${htmlFiles.length}`);
  assert(themeFiles.length === 30, `应有 30 个主题 CSS，实际为 ${themeFiles.length}`);
  assert(layoutFiles.length === 30, `应有 30 个布局 CSS，实际为 ${layoutFiles.length}`);
  assert(stylePages.length === 30, `应有 30 个风格展品，实际为 ${stylePages.length}`);
  assert(layoutPages.length === 30, `应有 30 个布局展品，实际为 ${layoutPages.length}`);

  const sourceMtime = Math.max(
    statSync(join(projectRoot, 'build.py')).mtimeMs,
    ...walk(join(projectRoot, 'src')).map(file => statSync(file).mtimeMs)
  );
  const oldestGenerated = Math.min(...htmlFiles.map(file => statSync(file).mtimeMs));
  assert(
    oldestGenerated >= sourceMtime,
    '生成页早于源文件，请先运行 npm run generate'
  );

  for (const file of htmlFiles) {
    const name = basename(file);
    const html = readFileSync(file, 'utf8');
    assert(/^<!doctype html>/i.test(html), `${name}: 缺少 DOCTYPE`);
    assert(/<html\b[^>]*lang=["']zh-CN["']/i.test(html), `${name}: 缺少语言声明`);
    assert(/<meta\s+charset=["']?UTF-8/i.test(html), `${name}: 缺少 UTF-8 声明`);
    assert(/<meta\b[^>]*name=["']viewport["']/i.test(html), `${name}: 缺少 viewport`);
    assert(/<title>[^<]+<\/title>/i.test(html), `${name}: 标题为空`);
    assert(!/{{[^}]+}}|\/\*__[A-Z_]+__\*\/|<!--__[A-Z_]+__-->/g.test(html), `${name}: 存在未替换占位符`);
    assert(
      (html.match(/{/g) || []).length === (html.match(/}/g) || []).length,
      `${name}: CSS/JS 花括号不匹配`
    );

    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    assert(ids.length === new Set(ids).size, `${name}: 存在重复 id`);
    for (const href of localLinks(html)) {
      assert(existsSync(resolve(projectRoot, href)), `${name}: 本地链接不存在 → ${href}`);
    }
  }

  for (const file of stylePages) {
    const html = readFileSync(file, 'utf8');
    assert(html.includes('data-kind="style"'), `${basename(file)}: 参数柜类型错误`);
    assert((html.match(/class="pd-range"/g) || []).length === 6, `${basename(file)}: 风格滑杆数量错误`);
  }
  for (const file of layoutPages) {
    const html = readFileSync(file, 'utf8');
    assert(html.includes('data-kind="layout"'), `${basename(file)}: 参数柜类型错误`);
    assert((html.match(/class="pd-range"/g) || []).length === 6, `${basename(file)}: 布局滑杆数量错误`);
  }

  const portal = readFileSync(join(projectRoot, 'index.html'), 'utf8');
  assert((portal.match(/\{\s*slug:\s*'/g) || []).length === 30, '门户主题数据不是 30 项');
  assert(portal.includes('document.startViewTransition'), '门户缺少主题交叉过渡');

  return {
    pages: htmlFiles.length,
    themes: themeFiles.length,
    layouts: layoutFiles.length,
    linksChecked: htmlFiles.reduce(
      (total, file) => total + localLinks(readFileSync(file, 'utf8')).length,
      0
    )
  };
}

if (resolve(process.argv[1] || '') === scriptPath) {
  try {
    const report = validateMuseum();
    console.log(
      `[museum] validation passed: ${report.pages} pages / ${report.themes} themes / ` +
      `${report.layouts} layouts / ${report.linksChecked} local links`
    );
  } catch (error) {
    console.error(`[museum] validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
