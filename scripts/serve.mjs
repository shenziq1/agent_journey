import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const build = spawnSync(process.execPath, [fileURLToPath(new URL('./build.mjs', import.meta.url))], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const port = Number(process.env.PORT || 3000);
const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
for (const [name, type] of [['original.html', 'text/html; charset=utf-8'], ['original.mjs', 'text/javascript; charset=utf-8'], ['article-crypto.mjs', 'text/javascript; charset=utf-8'], ['original.encrypted.json', 'application/json']]) files[`/${name}`] = [name, type];
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = files[pathname];
  if (!file || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const content = await readFile(new URL(`../dist/${file[0]}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': file[1], 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(500); res.end('Build output unavailable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Agent Journey 本地服务已启动，端口 ${server.address().port}；Ctrl+C 停止。`));
