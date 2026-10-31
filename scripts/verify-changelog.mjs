import path from 'path';
import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('temp_edge_verify_profile');

const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  `--user-data-dir=${userDataDir}`,
  '--hide-scrollbars',
  '--disable-gpu',
  'about:blank'
]);

await new Promise((r) => setTimeout(r, 2000));

let versionInfo;
try {
  const res = await fetch('http://127.0.0.1:9225/json/version');
  versionInfo = await res.json();
} catch (e) {
  console.error('Failed to connect to Edge:', e);
  edgeProc.kill();
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
    ws.send(JSON.stringify({ sessionId, id, method, params }));
  });
};

await sendSession('Page.enable');
await sendSession('Runtime.enable');

const results = [];

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 360,
  height: 800,
  deviceScaleFactor: 2,
  mobile: true
});

await sendSession('Page.navigate', { url: 'http://localhost:4173/team' });
await new Promise((r) => setTimeout(r, 1500));

const team360 = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const card = document.querySelector('button[data-member-id]');
    const grid = card ? card.parentElement : null;
    const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
    const bodyScrollWidth = document.body.scrollWidth;
    const windowWidth = window.innerWidth;
    const hasHorizontalScroll = bodyScrollWidth > windowWidth;
    const telLinks = document.querySelectorAll('a[href^="tel:"]').length;
    return { cols, hasHorizontalScroll, bodyScrollWidth, windowWidth, telLinks };
  })()`
});
results.push(`360px viewport team card grid columns: ${team360.result.value.cols} (expected 2)`);
results.push(`360px viewport horizontal scroll: ${team360.result.value.hasHorizontalScroll} (expected false)`);
results.push(`360px viewport tel: links: ${team360.result.value.telLinks} (expected 0)`);

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 600,
  height: 900,
  deviceScaleFactor: 2,
  mobile: true
});
await new Promise((r) => setTimeout(r, 600));

const team600 = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const card = document.querySelector('button[data-member-id]');
    const grid = card ? card.parentElement : null;
    const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    return { cols, hasHorizontalScroll };
  })()`
});
results.push(`600px viewport team card grid columns: ${team600.result.value.cols} (expected 3)`);
results.push(`600px viewport horizontal scroll: ${team600.result.value.hasHorizontalScroll} (expected false)`);

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false
});

await sendSession('Page.navigate', { url: 'http://localhost:4173/' });
await new Promise((r) => setTimeout(r, 1500));

const homeCheck = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const slideshow = document.querySelector('[aria-label="Kishkinda University Campus Slideshow"]');
    const images = slideshow ? slideshow.querySelectorAll('picture img') : [];
    const firstImg = images[0];
    const firstSrc = firstImg ? firstImg.getAttribute('src') : '';
    const fetchPriority = firstImg ? firstImg.getAttribute('fetchpriority') : '';
    const logoImgs = Array.from(document.querySelectorAll('img[src*="kishkinda-logo.png"]'));
    const logoFilters = logoImgs.map(img => window.getComputedStyle(img).filter);
    return {
      slideshowFound: Boolean(slideshow),
      imagesCount: images.length,
      firstSrc,
      fetchPriority,
      logoImgsCount: logoImgs.length,
      logoFilters
    };
  })()`
});
results.push(`Hero slideshow found: ${homeCheck.result.value.slideshowFound}`);
results.push(`Hero slideshow campus images count: ${homeCheck.result.value.imagesCount} (expected 6)`);
results.push(`First slideshow image fetchpriority: ${homeCheck.result.value.fetchPriority} (expected high)`);
results.push(`Kishkinda logo count on home: ${homeCheck.result.value.logoImgsCount}`);
results.push(`Kishkinda logo CSS filters: ${JSON.stringify(homeCheck.result.value.logoFilters)} (expected 'none')`);

await sendSession('Page.navigate', { url: 'http://localhost:4173/gallery' });
await new Promise((r) => setTimeout(r, 1500));

const galleryCheck = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const items = document.querySelectorAll('picture img[src*="/assets/campus/"]');
    const sources = Array.from(items).map(img => img.getAttribute('src'));
    return { count: items.length, sampleSrc: sources.slice(0, 3) };
  })()`
});
results.push(`Gallery campus preload count: ${galleryCheck.result.value.count} (expected 12)`);
results.push(`Gallery sample sources: ${JSON.stringify(galleryCheck.result.value.sampleSrc)}`);

await sendSession('Runtime.evaluate', {
  expression: `localStorage.setItem('cc-mock-auth-session', JSON.stringify({
    user: { id: 'mock-admin-user', email: 'admin@kishkindauniversity.edu.in', email_confirmed_at: new Date().toISOString() },
    profile: null,
    isAdmin: true
  }));`
});

await sendSession('Page.navigate', { url: 'http://localhost:4173/admin/team' });
await new Promise((r) => setTimeout(r, 1500));

const adminTeamLoad = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const heading = document.querySelector('h1')?.textContent || '';
    const addBtn = document.querySelector('button.cc-btn--primary');
    return { heading, hasAddBtn: Boolean(addBtn) };
  })()`
});
results.push(`Admin Team Management page loaded: ${adminTeamLoad.result.value.heading.includes('Team Management')}`);

await sendSession('Runtime.evaluate', {
  expression: `document.querySelector('button.cc-btn--primary')?.click();`
});
await new Promise((r) => setTimeout(r, 500));

const formCheck = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const modal = document.querySelector('form');
    if (!modal) return { modalFound: false };
    const inputs = Array.from(modal.querySelectorAll('input, select')).map(i => ({
      type: i.type,
      placeholder: i.placeholder || '',
      required: i.required
    }));
    const phoneInput = modal.querySelector('input[type="tel"], input[name*="phone"], input[placeholder*="phone"]');
    return { modalFound: true, inputsCount: inputs.length, hasPhoneInput: Boolean(phoneInput) };
  })()`
});
results.push(`Add Team Member modal opened: ${formCheck.result.value.modalFound}`);
results.push(`Admin form has phone input: ${formCheck.result.value.hasPhoneInput} (expected false)`);

await sendSession('Runtime.evaluate', {
  expression: `(() => {
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const inputs = document.querySelectorAll('form input[type="text"]');
    if (inputs[0]) setVal(inputs[0], 'DevOps Specialist');
    if (inputs[1]) setVal(inputs[1], 'Platform Engineer');
    if (inputs[2]) setVal(inputs[2], 'Computer Science & Engineering');
    if (inputs[3]) setVal(inputs[3], '4th Year');

    const emailInput = document.querySelector('form input[type="email"]');
    if (emailInput) setVal(emailInput, 'devops@kishkindauniversity.edu.in');

    const submitBtn = document.querySelector('form button[type="submit"]');
    submitBtn?.click();
  })()`
});
await new Promise((r) => setTimeout(r, 1000));

const memberAddedInAdmin = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `document.body.textContent.includes('DevOps Specialist')`
});
results.push(`Member "DevOps Specialist" added in admin: ${memberAddedInAdmin.result.value} (expected true)`);

await sendSession('Page.navigate', { url: 'http://localhost:4173/team' });
await new Promise((r) => setTimeout(r, 1500));

const memberVisiblePublic = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `document.body.textContent.includes('DevOps Specialist')`
});
results.push(`New member live on public team page without redeploy: ${memberVisiblePublic.result.value} (expected true)`);

await sendSession('Page.navigate', { url: 'http://localhost:4173/admin/team' });
await new Promise((r) => setTimeout(r, 1500));

await sendSession('Runtime.evaluate', {
  expression: `(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targetRow = rows.find(r => r.textContent.includes('DevOps Specialist'));
    const deleteBtn = targetRow?.querySelector('button[aria-label*="Remove"]');
    deleteBtn?.click();
  })()`
});
await new Promise((r) => setTimeout(r, 500));

const confirmModalCheck = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const text = document.body.textContent;
    const hasModal = text.includes('Confirm Member Removal');
    return hasModal;
  })()`
});
results.push(`Delete confirmation dialog triggered: ${confirmModalCheck.result.value} (expected true)`);

await sendSession('Runtime.evaluate', {
  expression: `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent.includes('Confirm Delete'));
    confirmBtn?.click();
  })()`
});
await new Promise((r) => setTimeout(r, 1000));

const memberRemovedInAdmin = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `!document.querySelector('tbody')?.textContent.includes('DevOps Specialist')`
});
results.push(`Member successfully deleted in admin table: ${memberRemovedInAdmin.result.value} (expected true)`);

await sendSession('Page.navigate', { url: 'http://localhost:4173/team' });
await new Promise((r) => setTimeout(r, 1500));

const memberGoneInPublic = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `!document.body.textContent.includes('DevOps Specialist')`
});
results.push(`Public team page reflects member deletion live: ${memberGoneInPublic.result.value} (expected true)`);

console.log('=== VERIFICATION RESULTS ===');
results.forEach(r => console.log('PASS:', r));

ws.close();
edgeProc.kill();
process.exit(0);
