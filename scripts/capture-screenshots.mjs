import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const distDir = path.resolve('dist');

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

server.listen(4173, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_profile');
  
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    versionInfo = await res.json();
  } catch {
    edgeProc.kill();
    server.close();
    process.exit(1);
  }

  const wsUrl = versionInfo.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

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

  const viewports = [
    { name: '375', width: 375, height: 812, mobile: true },
    { name: '768', width: 768, height: 1024, mobile: false },
    { name: '1440', width: 1440, height: 900, mobile: false }
  ];

  const themes = ['light', 'dark'];
  const outDir = path.resolve('docs/ux-pass-1');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const vp of viewports) {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });

    for (const theme of themes) {
      for (const route of routes) {
        const url = `http://localhost:4173${route.path}`;
        await sendSession('Page.navigate', { url });
        await new Promise((r) => setTimeout(r, 600));

        await sendSession('Runtime.evaluate', {
          expression: `
            localStorage.setItem('cc-theme', '${theme}');
            document.documentElement.setAttribute('data-theme', '${theme}');
            if ('${theme}' === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `
        });

        await new Promise((r) => setTimeout(r, 400));

        const screenshot = await sendSession('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: 0,
            y: 0,
            width: vp.width,
            height: vp.height,
            scale: 1
          }
        });

        if (screenshot && screenshot.data) {
          const fileName = `${route.name}-${vp.name}-${theme}.png`;
          const filePath = path.join(outDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
          console.log(`Saved: ${fileName}`);
        }
      }
    }
  }

  ws.close();
  edgeProc.kill();
  server.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
});
