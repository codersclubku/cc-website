import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const distDir = path.resolve('dist');
const axeSource = fs.readFileSync(path.resolve('node_modules/axe-core/axe.min.js'), 'utf-8');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4174, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_axe_profile');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9223/json/version');
    versionInfo = await res.json();
  } catch {
    edgeProc.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(versionInfo.webSocketDebuggerUrl);
  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const resolver = pending.get(msg.id);
      pending.delete(msg.id);
      resolver(msg.result);
    }
  };

  await new Promise((r) => {
    ws.onopen = r;
  });

  const send = (method, params = {}) => {
    const id = idCounter++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const pagesRes = await send('Target.getTargets');
  const pageTarget = pagesRes.targetInfos.find((t) => t.type === 'page');
  const attachRes = await send('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
  const sessionId = attachRes.sessionId;

  const sendSession = (method, params = {}) => {
    const id = idCounter++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  };

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');

  const routes = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'EventDetail', path: '/events/kishkinda-hack-2026' },
    { name: 'Projects', path: '/projects' },
    { name: 'Team', path: '/team' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Register', path: '/register' },
    { name: 'Contact', path: '/contact' },
    { name: 'AdminDashboard', path: '/admin' }
  ];

  let totalSeriousOrCritical = 0;

  for (const route of routes) {
    const url = `http://localhost:4174${route.path}`;
    await sendSession('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 600));

    await sendSession('Runtime.evaluate', {
      expression: axeSource
    });

    const axeResult = await sendSession('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
            }
          }).then(resolve);
        })
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const violations = (axeResult.result && axeResult.result.value && axeResult.result.value.violations) || [];
    const seriousCritical = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    totalSeriousOrCritical += seriousCritical.length;

    console.log(`Route: ${route.name} (${route.path}) - Violations: ${violations.length} total, ${seriousCritical.length} serious/critical`);
    if (seriousCritical.length > 0) {
      seriousCritical.forEach((v) => {
        console.log(`  [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
      });
    }
  }

  ws.close();
  edgeProc.kill();
  server.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}

  console.log(`\nTOTAL SERIOUS/CRITICAL VIOLATIONS: ${totalSeriousOrCritical}`);
  process.exit(totalSeriousOrCritical === 0 ? 0 : 1);
});
