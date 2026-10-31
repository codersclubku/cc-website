import { spawn } from 'node:child_process';
import http from 'node:http';

async function checkHeaders() {
  const proc = spawn('npx', ['vite', 'preview', '--port', '4199', '--strictPort'], {
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:4199/', (response) => {
        resolve(response);
      }).on('error', reject);
    });

    console.log('Status:', res.statusCode);
    const requiredHeaders = [
      'content-security-policy',
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy',
      'permissions-policy'
    ];

    let allPresent = true;
    for (const h of requiredHeaders) {
      const val = res.headers[h];
      if (val) {
        console.log(`[PASS] ${h}: ${val}`);
      } else {
        console.log(`[FAIL] ${h} is MISSING`);
        allPresent = false;
      }
    }

    proc.kill();
    process.exit(allPresent ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    proc.kill();
    process.exit(1);
  }
}

checkHeaders();
