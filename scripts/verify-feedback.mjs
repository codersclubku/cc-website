import assert from 'node:assert';

const BASE_URL = 'http://localhost:5174';

async function testFeedbackAPI() {
  const emptyRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'bug', title: '', description: '' })
  });
  assert.strictEqual(emptyRes.status, 400);
  const emptyJson = await emptyRes.json();
  assert.strictEqual(emptyJson.success, false);

  const honeypotRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'bug',
      title: 'Valid Title',
      description: 'This is a valid description that has more than twenty characters.',
      page: '/events',
      severity: 'Medium',
      websiteUrl: 'https://spam-bot.xyz'
    })
  });
  assert.strictEqual(honeypotRes.status, 400);

  const bugRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'bug',
      title: 'Mobile menu transition glitch',
      description: 'The mobile menu transitions smoothly but sometimes jitters on fast taps in iOS webkit.',
      page: '/events',
      severity: 'Medium',
      stepsToReproduce: '1. Open /events\n2. Rapidly tap menu icon',
      name: 'Aditi Sharma',
      email: 'aditi@example.com',
      replyRequested: true,
      meta: {
        userAgent: 'Mozilla/5.0 iPhone',
        viewport: '360x780',
        theme: 'dark',
        route: '/events'
      }
    })
  });
  assert.strictEqual(bugRes.status, 201);
  const bugJson = await bugRes.json();
  assert.strictEqual(bugJson.success, true);
  assert.match(bugJson.referenceId, /^FB-\d{8}-[A-Z0-9]{4}$/);

  const suggestionRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'suggestion',
      title: 'Host an Open Source Hackathon',
      description: 'We should organize an all-night hackathon focusing on contributing to open source repositories.',
      category: 'Events',
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      replyRequested: false
    })
  });
  assert.strictEqual(suggestionRes.status, 201);
  const suggestionJson = await suggestionRes.json();
  assert.strictEqual(suggestionJson.success, true);
  assert.match(suggestionJson.referenceId, /^FB-\d{8}-[A-Z0-9]{4}$/);

  const issueRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'issue',
      title: 'Lab 3 terminal environment discrepancy',
      description: 'The git proxy environment variables in lab 3 are pointing to outdated semester endpoints.',
      category: 'Club management',
      anonymous: true
    })
  });
  assert.strictEqual(issueRes.status, 201);
  const issueJson = await issueRes.json();
  assert.strictEqual(issueJson.success, true);
  assert.match(issueJson.referenceId, /^FB-\d{8}-[A-Z0-9]{4}$/);

  const rateLimitRes = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'other',
      title: 'Fourth submission in an hour',
      description: 'This is the fourth submission within the same hour and must be rejected by rate limiting.',
      replyRequested: false
    })
  });
  assert.strictEqual(rateLimitRes.status, 429, 'Fourth submission must return 429 Rate Limit Exceeded');
  const rateLimitJson = await rateLimitRes.json();
  assert.strictEqual(rateLimitJson.success, false);

  const getRes = await fetch(`${BASE_URL}/api/feedback`);
  assert.strictEqual(getRes.status, 200);
  const list = await getRes.json();
  assert.ok(Array.isArray(list));
  assert.ok(list.length >= 3);

  const foundBug = list.find((i) => i.id === bugJson.id);
  assert.ok(foundBug);
  assert.strictEqual(foundBug.type, 'bug');
  assert.strictEqual(foundBug.severity, 'Medium');
  assert.strictEqual(foundBug.status, 'new');

  const foundIssue = list.find((i) => i.id === issueJson.id);
  assert.ok(foundIssue);
  assert.strictEqual(foundIssue.type, 'issue');
  assert.strictEqual(foundIssue.anonymous, true);
  assert.strictEqual(foundIssue.name, null);
  assert.strictEqual(foundIssue.email, null);

  const patchRes = await fetch(`${BASE_URL}/api/feedback/${bugJson.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'in-review',
      internalNote: 'Assigned to coordinator for reproduction on iOS simulator.'
    })
  });
  assert.strictEqual(patchRes.status, 200);
  const patchJson = await patchRes.json();
  assert.strictEqual(patchJson.success, true);
  assert.strictEqual(patchJson.record.status, 'in-review');
  assert.strictEqual(patchJson.record.internalNote, 'Assigned to coordinator for reproduction on iOS simulator.');

  process.stdout.write('ALL 8 FEEDBACK TESTS PASSED: VALIDATION, RATE LIMITING, HONEYPOT, ANONYMITY, RETRIEVAL, AND ADMIN PATCH.\n');
}

testFeedbackAPI().catch((err) => {
  process.stderr.write(`Test failed: ${err.stack || err}\n`);
  process.exit(1);
});
