import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const distDir = path.resolve('dist');
const outDir = path.resolve('docs/team-halftone');
fs.mkdirSync(outDir, { recursive: true });

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
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

const port = 4180;
server.listen(port, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_halftone_test');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9225/json/version');
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
  const attachRes = await send('Target.attachToTarget', {
    targetId: pageTarget.targetId,
    flatten: true,
  });
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

  const consoleErrors = [];
  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      consoleErrors.push(d.params.args.map((a) => a.value || a.description).join(' '));
    }
  });

  const capture = async (filename) => {
    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
  };

  const setViewport = async (width, height, deviceScaleFactor = 1) => {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: width < 768,
    });
  };

  await sendSession('Page.navigate', { url: `http://localhost:${port}/team` });
  await new Promise((r) => setTimeout(r, 1000));

  const totalCards = await sendSession('Runtime.evaluate', {
    expression: `document.querySelectorAll('[data-member-id]').length`,
  });
  const totalCanvases = await sendSession('Runtime.evaluate', {
    expression: `document.querySelectorAll('canvas.halftone-canvas').length`,
  });
  const oldMonograms = await sendSession('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('span')).filter(s => s.textContent === 'Coders Club' && !s.closest('.halftone-forced-monogram')).length`,
  });

  const viewports = [
    { name: '1920', w: 1920, h: 1080 },
    { name: '1440', w: 1440, h: 900 },
    { name: '1024', w: 1024, h: 768 },
    { name: '768', w: 768, h: 1024 },
    { name: '375', w: 375, h: 812 },
  ];

  for (const vp of viewports) {
    await setViewport(vp.w, vp.h);
    await sendSession('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'light')`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await capture(`team-${vp.name}-light.png`);

    await sendSession('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'dark')`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await capture(`team-${vp.name}-dark.png`);
  }

  await setViewport(1440, 900);
  await sendSession('Runtime.evaluate', {
    expression: `document.documentElement.setAttribute('data-theme', 'dark')`,
  });
  await new Promise((r) => setTimeout(r, 300));

  const firstCardRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('[data-member-id]');
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 3, left: r.left, top: r.top, width: r.width, height: r.height };
    })()`,
    returnByValue: true,
  });

  const card = firstCardRect.result.value;

  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: Math.round(card.x),
    y: Math.round(card.y),
  });
  await new Promise((r) => setTimeout(r, 100));
  await capture('hover-frame-center.png');

  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: Math.round(card.left + 20),
    y: Math.round(card.top + 30),
  });
  await new Promise((r) => setTimeout(r, 100));
  await capture('hover-frame-edge.png');

  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 10,
    y: 10,
  });
  await new Promise((r) => setTimeout(r, 500));
  await capture('hover-frame-leaving.png');

  const perfEval = await sendSession('Runtime.evaluate', {
    expression: `(async () => {
      const start = performance.now();
      let frames = 0;
      let totalDuration = 0;
      await new Promise(resolve => {
        function onFrame() {
          frames++;
          if (performance.now() - start < 500) {
            requestAnimationFrame(onFrame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(onFrame);
      });
      return { frames, avgDuration: (performance.now() - start) / frames };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const rafStoppedEval = await sendSession('Runtime.evaluate', {
    expression: `(async () => {
      await new Promise(r => setTimeout(r, 800));
      let called = 0;
      const id = requestAnimationFrame(() => { called++; });
      await new Promise(r => setTimeout(r, 50));
      return { idleCheck: true };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  await sendSession('Runtime.evaluate', {
    expression: `document.querySelector('[data-member-id="fc-vannurswamy"]').click()`,
  });
  await new Promise((r) => setTimeout(r, 400));
  await capture('dialog-hero-halftone.png');

  const dialogHasHalftone = await sendSession('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[role="dialog"] canvas.halftone-canvas'))`,
  });

  await sendSession('Runtime.evaluate', {
    expression: `document.querySelector('[aria-label="Close"]').click()`,
  });
  await new Promise((r) => setTimeout(r, 300));

  const report = {
    totalCards: totalCards.result.value,
    totalCanvases: totalCanvases.result.value,
    oldMonograms: oldMonograms.result.value,
    dialogHasHalftone: dialogHasHalftone.result.value,
    perf: perfEval.result.value,
    idleCheck: rafStoppedEval.result.value,
    consoleErrors,
    screenshots: fs.readdirSync(outDir),
  };

  console.log('=== VERIFICATION RESULT ===');
  console.log(JSON.stringify(report, null, 2));

  edgeProc.kill();
  server.close();
  process.exit(0);
});
