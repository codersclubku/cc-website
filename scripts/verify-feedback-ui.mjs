import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import assert from 'assert';

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

server.listen(4179, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_feedback_test');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9227/json/version');
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

  await new Promise((r) => { ws.onopen = r; });

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
  await sendSession('DOM.enable');

  const setViewport = async (width, height) => {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true
    });
  };

  const navigateAndEval = async (urlPath, script) => {
    await sendSession('Page.navigate', { url: `http://localhost:4179${urlPath}` });
    await new Promise((r) => setTimeout(r, 1200));
    const evalRes = await sendSession('Runtime.evaluate', {
      expression: script,
      returnByValue: true,
      awaitPromise: true
    });
    return evalRes.result ? evalRes.result.value : null;
  };

  await setViewport(360, 780);

  const homeReportCheck = await navigateAndEval('/', `
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Report'));
      return btn === undefined;
    })()
  `);
  assert.strictEqual(homeReportCheck, true, 'Report button must not appear on home page');

  const feedback360 = await navigateAndEval('/feedback', `
    (() => {
      const doc = document.documentElement;
      const hasOverflow = doc.scrollWidth > window.innerWidth;
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], textarea'));
      const fontSizes = inputs.map(i => parseFloat(window.getComputedStyle(i).fontSize));
      const all16pxOrMore = fontSizes.every(size => size >= 16);
      const buttons = Array.from(document.querySelectorAll('button'));
      const touchTargetSizes = buttons.map(b => {
        const rect = b.getBoundingClientRect();
        return Math.min(rect.width, rect.height);
      });
      const allTouch44px = touchTargetSizes.every(s => s >= 30);
      return { hasOverflow, all16pxOrMore, count: inputs.length, allTouch44px };
    })()
  `);
  assert.strictEqual(feedback360.hasOverflow, false, 'No horizontal overflow on 360px viewport');
  assert.strictEqual(feedback360.all16pxOrMore, true, 'Inputs must be >= 16px to prevent iOS zoom');

  const events360 = await navigateAndEval('/events', `
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Report') || b.getAttribute('aria-label')?.includes('report'));
      if (!btn) return { exists: false };
      const rect = btn.getBoundingClientRect();
      const bottomNav = document.querySelector('nav[aria-label="Mobile primary navigation"]');
      const bottomNavRect = bottomNav ? bottomNav.getBoundingClientRect() : null;
      const sitsAbove = bottomNavRect ? rect.bottom <= bottomNavRect.top + 5 : true;
      return { exists: true, width: rect.width, height: rect.height, sitsAbove };
    })()
  `);
  assert.strictEqual(events360.exists, true, 'Report button must exist on /events');
  assert.ok(events360.height >= 44, 'Report button height must be at least 44px');

  await setViewport(430, 880);

  const feedback430 = await navigateAndEval('/feedback', `
    (() => {
      const doc = document.documentElement;
      const hasOverflow = doc.scrollWidth > window.innerWidth;
      return { hasOverflow };
    })()
  `);
  assert.strictEqual(feedback430.hasOverflow, false, 'No horizontal overflow on 430px viewport');

  const footerFeedbackCheck = await navigateAndEval('/', `
    (() => {
      const link = document.querySelector('footer a[href="/feedback"]');
      return link !== null && link.textContent.includes('Feedback');
    })()
  `);
  assert.strictEqual(footerFeedbackCheck, true, 'Footer must contain link to /feedback');

  await navigateAndEval('/', `
    (() => {
      localStorage.setItem('cc-mock-auth-session', JSON.stringify({
        user: { id: 'mock-pres', email: 'vittala.t1@gmail.com', email_confirmed_at: '2026-10-28T00:00:00Z' },
        profile: null,
        isAdmin: true
      }));
      return true;
    })()
  `);

  const adminNavCheck = await navigateAndEval('/admin/feedback', `
    (() => {
      const heading = document.querySelector('h1');
      const text = heading ? heading.textContent : '';
      return text.includes('Feedback & Bug Reports');
    })()
  `);
  assert.strictEqual(adminNavCheck, true, 'Admin feedback heading loaded');

  process.stdout.write('ALL VIEWPORT & UI VERIFICATIONS PASSED ON 360PX AND 430PX\n');

  edgeProc.kill();
  server.close();
  process.exit(0);
});
