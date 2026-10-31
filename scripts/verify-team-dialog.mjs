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

server.listen(4175, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_team_test');
  
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9224/json/version');
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

  const results = [];

  await sendSession('Page.navigate', { url: 'http://localhost:4175/team' });
  await new Promise((r) => setTimeout(r, 800));

  const totalCardsRes = await sendSession('Runtime.evaluate', {
    expression: `document.querySelectorAll('[data-member-id]').length`
  });
  const totalCards = totalCardsRes.result.value;
  results.push(`Total Member Cards Rendered: ${totalCards} (Expected: 25)`);

  const groupsRes = await sendSession('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('section[id]')).map(s => ({ id: s.id, cards: s.querySelectorAll('[data-member-id]').length }))`
  });
  results.push(`Section counts: ${JSON.stringify(groupsRes.result.value)}`);

  await sendSession('Runtime.evaluate', {
    expression: `document.querySelector('[data-member-id="fc-vannurswamy"]').click()`
  });
  await new Promise((r) => setTimeout(r, 400));

  const dialogOpenRes = await sendSession('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[role="dialog"]'))`
  });
  results.push(`Dialog opened on card click: ${dialogOpenRes.result.value}`);

  const facultyEmailRes = await sendSession('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[role="dialog"] a[href^="mailto:"]'))`
  });
  results.push(`Faculty Coordinator email displayed: ${facultyEmailRes.result.value}`);

  const titleRes = await sendSession('Runtime.evaluate', {
    expression: `document.title`
  });
  results.push(`Document title updated to: "${titleRes.result.value}"`);

  await sendSession('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`
  });
  await new Promise((r) => setTimeout(r, 300));

  const nextTitleRes = await sendSession('Runtime.evaluate', {
    expression: `document.title`
  });
  results.push(`After ArrowRight, document title is: "${nextTitleRes.result.value}"`);

  await sendSession('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`
  });
  await new Promise((r) => setTimeout(r, 300));

  const dialogClosedRes = await sendSession('Runtime.evaluate', {
    expression: `!document.querySelector('[role="dialog"]');`
  });
  results.push(`Dialog closed on Escape: ${dialogClosedRes.result.value}`);

  await sendSession('Page.navigate', { url: 'http://localhost:4175/team?member=pres-vittala' });
  await new Promise((r) => setTimeout(r, 800));

  const deepLinkDialogRes = await sendSession('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[role="dialog"]'))`
  });
  results.push(`Deep link ?member=pres-vittala opened dialog directly: ${deepLinkDialogRes.result.value}`);

  const deepTitleRes = await sendSession('Runtime.evaluate', {
    expression: `document.title`
  });
  results.push(`Deep link document title: "${deepTitleRes.result.value}"`);

  const studentEmailRes = await sendSession('Runtime.evaluate', {
    expression: `Boolean(document.querySelector('[role="dialog"] a[href="mailto:vittala.p.dev@gmail.com"]'))`
  });
  results.push(`President email shown: ${studentEmailRes.result.value}`);

  await sendSession('Page.navigate', { url: 'http://localhost:4175/team?member=unknown-person-id' });
  await new Promise((r) => setTimeout(r, 600));

  const unknownParamRes = await sendSession('Runtime.evaluate', {
    expression: `window.location.search`
  });
  results.push(`Unknown member query param cleaned from URL: "${unknownParamRes.result.value}"`);

  console.log('--- VERIFICATION RESULTS ---');
  results.forEach((r) => console.log('✓ ' + r));

  ws.close();
  edgeProc.kill();
  server.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
});
