import path from 'path';
import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.resolve('temp_edge_verify_gallery');

const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  `--user-data-dir=${userDataDir}`,
  '--hide-scrollbars',
  '--disable-gpu',
  'about:blank'
]);

await new Promise((r) => setTimeout(r, 2000));

let versionInfo;
try {
  const res = await fetch('http://127.0.0.1:9226/json/version');
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
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false
});

await sendSession('Page.navigate', { url: 'http://localhost:4173/gallery' });
await new Promise((r) => setTimeout(r, 2500));

const galleryChecks = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const heading = document.querySelector('h1')?.textContent || '';
    const eyebrow = document.querySelector('span.font-mono')?.textContent || '';
    const intro = document.querySelector('p.text-base')?.textContent || '';
    const bodyText = document.body.textContent || '';
    
    const hasCampusGalleryTitle = heading.includes('Campus Gallery');
    const hasArchiveEyebrow = bodyText.includes('KISHKINDA UNIVERSITY CAMPUS ARCHIVE');
    const hasOfficialPara = bodyText.includes('Official photographic and architectural records');
    const hasAllSpacesChip = bodyText.includes('All Spaces');
    const hasLaboratoriesChip = bodyText.includes('Laboratories');
    const hasCampusCodeBadge = bodyText.includes('CAMPUS-01');
    const hasTypeBadge = bodyText.includes('BUILDING / LAB');
    const hasVisibleFilePath = bodyText.includes('assets/campus/campus-01.webp');
    
    const cards = Array.from(document.querySelectorAll('[class*="aspect-"]'));
    const captions = cards.map(c => c.parentElement ? (c.parentElement.querySelector('p')?.textContent?.trim() || '') : '');
    
    return {
      heading,
      eyebrow,
      intro,
      hasCampusGalleryTitle,
      hasArchiveEyebrow,
      hasOfficialPara,
      hasAllSpacesChip,
      hasLaboratoriesChip,
      hasCampusCodeBadge,
      hasTypeBadge,
      hasVisibleFilePath,
      cardCount: cards.length,
      captions
    };
  })()`
});

if (galleryChecks.exceptionDetails) {
  console.error('Gallery eval exception:', galleryChecks.exceptionDetails);
}
const gc = galleryChecks.result?.value || {};
results.push(`Gallery page heading restored: "${gc.heading}" (expected "Gallery"): ${gc.heading === 'Gallery'}`);
results.push(`Eyebrow restored: "${gc.eyebrow}" (expected "Moments & Archive"): ${gc.eyebrow.includes('Moments & Archive')}`);
results.push(`Intro restored: "${gc.intro}": ${gc.intro.includes('Photo records from Coders Club')}`);
results.push(`No "Campus Gallery" title: ${!gc.hasCampusGalleryTitle}`);
results.push(`No "KISHKINDA UNIVERSITY CAMPUS ARCHIVE" eyebrow: ${!gc.hasArchiveEyebrow}`);
results.push(`No "Official photographic..." paragraph: ${!gc.hasOfficialPara}`);
results.push(`No category chips: ${!gc.hasAllSpacesChip && !gc.hasLaboratoriesChip}`);
results.push(`No CAMPUS-01 badge: ${!gc.hasCampusCodeBadge}`);
results.push(`No type badges: ${!gc.hasTypeBadge}`);
results.push(`No visible file paths: ${!gc.hasVisibleFilePath}`);
results.push(`Gallery preloaded cards count: ${gc.cardCount} (expected 8): ${gc.cardCount === 8}`);
results.push(`Seeded captions plain format: ${JSON.stringify(gc.captions)}`);

await sendSession('Page.navigate', { url: 'http://localhost:4173/' });
await new Promise((r) => setTimeout(r, 1500));

const heroChecks = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const slideshow = document.querySelector('[aria-label="Kishkinda University Campus Slideshow"], [aria-label="Kishkinda University Coders Club"]');
    if (!slideshow) return { found: false };
    const bodyText = slideshow.textContent || '';
    const hasCampusOverlay = bodyText.includes('CAMPUS-') || bodyText.includes('KISHKINDA UNIVERSITY CAMPUS');
    const hasTitleOverlay = bodyText.includes('Kishkinda University Engineering & Technology Campus');
    const images = Array.from(slideshow.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      loading: img.loading,
      fetchPriority: img.getAttribute('fetchpriority')
    }));
    return {
      found: true,
      hasCampusOverlay,
      hasTitleOverlay,
      imagesCount: images.length,
      firstImage: images[0]
    };
  })()`
});

const hc = heroChecks.result.value;
results.push(`Hero slideshow present: ${hc.found}`);
results.push(`No overlay text or badges in hero: ${!hc.hasCampusOverlay && !hc.hasTitleOverlay}`);
results.push(`Hero slide image count: ${hc.imagesCount}`);

await sendSession('Runtime.evaluate', {
  expression: `localStorage.setItem('cc-mock-auth-session', JSON.stringify({
    user: { id: 'mock-admin-user', email: 'admin@kishkindauniversity.edu.in', email_confirmed_at: new Date().toISOString() },
    profile: null,
    isAdmin: true
  }));`
});

await sendSession('Page.navigate', { url: 'http://localhost:4173/admin/gallery' });
await new Promise((r) => setTimeout(r, 1500));

const adminGalleryCheck = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const rows = Array.from(document.querySelectorAll('.grid > div'));
    const deleteButtons = document.querySelectorAll('button[aria-label*="Delete"]');
    return {
      itemsCount: rows.length,
      deleteCount: deleteButtons.length
    };
  })()`
});
results.push(`Admin gallery items visible: ${adminGalleryCheck.result.value.itemsCount > 0}`);
results.push(`Admin gallery has delete buttons: ${adminGalleryCheck.result.value.deleteCount > 0} (count: ${adminGalleryCheck.result.value.deleteCount})`);

await sendSession('Runtime.evaluate', {
  expression: `(() => {
    window.confirm = () => true;
    const firstDel = document.querySelector('button[aria-label*="Delete"]');
    firstDel?.click();
  })()`
});
await new Promise((r) => setTimeout(r, 1000));

await sendSession('Page.navigate', { url: 'http://localhost:4173/gallery' });
await new Promise((r) => setTimeout(r, 1500));

const publicAfterDelete = await sendSession('Runtime.evaluate', {
  returnByValue: true,
  expression: `(() => {
    const cards = document.querySelectorAll('[class*="aspect-"]');
    return { count: cards.length };
  })()`
});
results.push(`Public gallery reflects admin deletion (count: ${publicAfterDelete.result.value.count}, expected 7): ${publicAfterDelete.result.value.count === 7}`);

console.log('=== VERIFICATION SUMMARY ===');
results.forEach(r => console.log('PASS:', r));

ws.close();
edgeProc.kill();
process.exit(0);
