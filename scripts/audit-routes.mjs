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

server.listen(4174, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.resolve('temp_edge_audit');

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

  const wsUrl = versionInfo.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  const consoleLogs = [];
  const networkFailures = [];
  const unhandledRejections = [];

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
  await sendSession('Network.enable');

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error' || msg.params.type === 'warning') {
        const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
        if (!text.includes('Download the React DevTools') && !text.includes('Failed to load resource')) {
          consoleLogs.push({ type: msg.params.type, text });
        }
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'Unknown Exception';
      unhandledRejections.push(desc);
    } else if (msg.method === 'Network.responseReceived') {
      const status = msg.params.response.status;
      const url = msg.params.response.url;
      if (status >= 400 && !url.includes('favicon.ico')) {
        networkFailures.push({ status, url });
      }
    }
  });

  const routes = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'EventDetail', path: '/events/git-foundations' },
    { name: 'Register', path: '/register' },
    { name: 'Team', path: '/team' },
    { name: 'Projects', path: '/projects' },
    { name: 'ProjectDetail', path: '/projects/campus-event-hub' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'SignUp', path: '/signup' },
    { name: 'SignIn', path: '/signin' },
    { name: 'ForgotPassword', path: '/forgot-password' },
    { name: 'ResetPassword', path: '/reset-password' },
    { name: 'Onboarding', path: '/onboarding' },
    { name: 'Account', path: '/account' },
    { name: 'AdminLogin', path: '/admin/login' },
    { name: 'AdminDashboard', path: '/admin' },
    { name: 'AdminStudents', path: '/admin/students' },
    { name: 'AdminEvents', path: '/admin/events' },
    { name: 'AdminProjects', path: '/admin/projects' },
    { name: 'AdminRegistrations', path: '/admin/registrations' },
    { name: 'AdminCheckIn', path: '/admin/check-in' },
    { name: 'AdminAnnouncements', path: '/admin/announcements' },
    { name: 'AdminGallery', path: '/admin/gallery' },
    { name: 'AdminMessages', path: '/admin/messages' },
    { name: 'NotFound', path: '/non-existent-page-test' }
  ];

  const results = [];
  const qaDir = path.resolve('docs/qa');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  for (const r of routes) {
    consoleLogs.length = 0;
    networkFailures.length = 0;
    unhandledRejections.length = 0;

    const url = `http://localhost:4174${r.path}`;
    await sendSession('Page.navigate', { url });
    await new Promise((resolve) => setTimeout(resolve, 600));

    const ss = await sendSession('Page.captureScreenshot', { format: 'png' });
    if (ss && ss.data) {
      fs.writeFileSync(path.join(qaDir, `${r.name}.png`), Buffer.from(ss.data, 'base64'));
    }

    const errCount = consoleLogs.filter((l) => l.type === 'error').length + unhandledRejections.length;
    const netCount = networkFailures.length;
    const status = errCount === 0 && netCount === 0 ? 'PASS' : 'FAIL';

    results.push({
      route: r.path,
      name: r.name,
      consoleErrors: errCount,
      networkFailures: netCount,
      details: [...consoleLogs.map((l) => l.text), ...unhandledRejections, ...networkFailures.map((n) => `${n.status} ${n.url}`)].join(' | '),
      status
    });
  }

  ws.close();
  edgeProc.kill();
  server.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch { }

  console.log('\n======================================================');
  console.log('ROUTE AUDIT RESULTS TABLE');
  console.log('======================================================');
  console.log('| Route | Console errors | Network failures | Status |');
  console.log('|---|---|---|---|');
  for (const res of results) {
    console.log(`| ${res.route} | ${res.consoleErrors} | ${res.networkFailures} | ${res.status} |`);
  }
  console.log('======================================================\n');

  const failed = results.filter((r) => r.status === 'FAIL');
  if (failed.length > 0) {
    console.error(`Audit failed with ${failed.length} failing routes:`);
    for (const f of failed) {
      console.error(`- ${f.route}: ${f.details}`);
    }
    process.exit(1);
  } else {
    console.log('ALL ROUTES PASSED ZERO-ERROR AUDIT.');
    process.exit(0);
  }
});
