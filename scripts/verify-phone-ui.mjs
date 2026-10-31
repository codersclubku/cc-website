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

server.listen(4188, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_phone_test');
  
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    `--user-data-dir=${userDataDir}`,
    '--hide-scrollbars',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  let versionInfo;
  try {
    const res = await fetch('http://127.0.0.1:9229/json/version');
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
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sendSession('Page.navigate', { url: 'http://localhost:4188/team' });
  await new Promise((r) => setTimeout(r, 1200));

  await sendSession('Runtime.evaluate', {
    expression: `document.getElementById('office-bearers')?.scrollIntoView()`
  });
  await new Promise((r) => setTimeout(r, 400));

  const cardsShot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('docs/qa/phone-cards-check.png', Buffer.from(cardsShot.data, 'base64'));

  // Check card phone icons on Vittala and Abhiram cards
  const cardCheckRes = await sendSession('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const vittalaCard = document.querySelector('[data-member-id="pres-vittala"]');
      const abhiramCard = document.querySelector('[data-member-id="vp-abhiram"]');
      const otherCard = document.querySelector('[data-member-id="sec-chinmai"]');

      return {
        vittalaFound: !!vittalaCard,
        vittalaHasPhoneLink: !!vittalaCard?.querySelector('a[href^="tel:"]'),
        vittalaHasPhoneAction: !!vittalaCard?.querySelector('a[aria-label="Call T Vittala"]'),
        abhiramFound: !!abhiramCard,
        abhiramHasPhoneLink: !!abhiramCard?.querySelector('a[href^="tel:"]'),
        abhiramHasPhoneAction: !!abhiramCard?.querySelector('a[aria-label="Call D V N S Abhiram"]'),
        otherHasPhone: !!otherCard?.querySelector('a[href^="tel:"]')
      };
    })()`
  });
  console.log('Card checks:', JSON.stringify(cardCheckRes.result.value, null, 2));

  // Click Vittala card to open dialog
  await sendSession('Runtime.evaluate', {
    expression: `document.querySelector('[data-member-id="pres-vittala"]').click()`
  });
  await new Promise((r) => setTimeout(r, 500));

  const dialogCheckRes = await sendSession('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { dialogOpen: false };
      const phoneLink = dialog.querySelector('a[href^="tel:"]');
      const emailLink = dialog.querySelector('a[href^="mailto:"]');
      const callBtn = Array.from(dialog.querySelectorAll('a')).find(a => a.textContent.trim() === 'Call');
      const copyPhoneBtn = dialog.querySelector('button[aria-label="Copy phone number"]');
      return {
        dialogOpen: true,
        phoneHref: phoneLink?.getAttribute('href'),
        phoneText: phoneLink?.textContent?.trim(),
        emailHref: emailLink?.getAttribute('href'),
        callBtnHref: callBtn?.getAttribute('href'),
        hasCopyPhoneBtn: !!copyPhoneBtn
      };
    })()`
  });
  console.log('Dialog checks (Vittala):', JSON.stringify(dialogCheckRes.result.value, null, 2));

  const vittalaShot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('docs/qa/phone-dialog-vittala.png', Buffer.from(vittalaShot.data, 'base64'));

  // Navigate to Abhiram in dialog
  await sendSession('Runtime.evaluate', {
    expression: `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`
  });
  await new Promise((r) => setTimeout(r, 500));

  const abhiramDialogRes = await sendSession('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { dialogOpen: false };
      const phoneLink = dialog.querySelector('a[href^="tel:"]');
      const callBtn = Array.from(dialog.querySelectorAll('a')).find(a => a.textContent.trim() === 'Call');
      const name = dialog.querySelector('h2')?.textContent?.trim();
      return {
        name,
        phoneHref: phoneLink?.getAttribute('href'),
        phoneText: phoneLink?.textContent?.trim(),
        callBtnHref: callBtn?.getAttribute('href')
      };
    })()`
  });
  console.log('Dialog checks (Abhiram):', JSON.stringify(abhiramDialogRes.result.value, null, 2));

  const screenshot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('docs/qa/phone-dialog-check.png', Buffer.from(screenshot.data, 'base64'));
  console.log('Saved screenshot to docs/qa/phone-dialog-check.png');

  ws.close();
  edgeProc.kill();
  server.close();
  process.exit(0);
});
