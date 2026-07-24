import { readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { extname, relative, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPython } from './lib/python.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8081);
const clients = new Set();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};
const reloadClient = `<script>
new EventSource('/__museum_reload').onmessage = event => {
  if (event.data === 'reload') location.reload();
};
</script>`;

function generate() {
  runPython(['build.py'], { cwd: root });
}

function serveFile(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (pathname === '/__museum_reload') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    response.write(': connected\n\n');
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }

  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = resolve(root, requested);
  if (relative(root, target).startsWith('..')) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (!statSync(target).isFile()) throw new Error('not a file');
    let body = readFileSync(target);
    if (extname(target) === '.html') {
      body = Buffer.from(
        body.toString('utf8').replace('</body>', `${reloadClient}</body>`),
        'utf8'
      );
    }
    response.writeHead(200, {
      'Content-Type': mime[extname(target)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 · 展品不存在');
  }
}

generate();
const server = createServer(serveFile);
server.listen(port, '127.0.0.1', () => {
  console.log(`[museum] dev server: http://127.0.0.1:${port}/`);
  console.log('[museum] watching src/ and build.py; changes rebuild and reload the browser');
});

let timer;
let building = false;
let queued = false;
function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    try {
      generate();
      for (const client of clients) client.write('data: reload\n\n');
      console.log(`[museum] ${new Date().toLocaleTimeString()} rebuilt; browser reload queued`);
    } catch (error) {
      console.error(`[museum] rebuild failed: ${error.message}`);
    } finally {
      building = false;
      if (queued) {
        queued = false;
        scheduleBuild();
      }
    }
  }, 180);
}

function directoriesUnder(directory) {
  return [
    directory,
    ...readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .flatMap(entry => directoriesUnder(resolve(directory, entry.name)))
  ];
}

let watchers;
try {
  watchers = [
    watch(resolve(root, 'src'), { recursive: true }, scheduleBuild),
    watch(resolve(root, 'build.py'), scheduleBuild)
  ];
} catch {
  watchers = [
    ...directoriesUnder(resolve(root, 'src')).map(directory => watch(directory, scheduleBuild)),
    watch(resolve(root, 'build.py'), scheduleBuild)
  ];
}

function close() {
  for (const watcher of watchers) watcher.close();
  for (const client of clients) client.end();
  server.close(() => process.exit(0));
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
