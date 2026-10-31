import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { feedbackSubmissionSchema, sanitizeText } from '../lib/feedbackValidation.ts';
import type { FeedbackRecord, FeedbackStatus } from '../types/feedback.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'feedback.json');

const ipRateLimits = new Map<string, number[]>();
const adminFailLimits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const history = ipRateLimits.get(ip) || [];
  const valid = history.filter((timestamp) => now - timestamp < windowMs);
  ipRateLimits.set(ip, valid);
  return valid.length >= 3;
}

function recordSubmission(ip: string): void {
  const now = Date.now();
  const history = ipRateLimits.get(ip) || [];
  history.push(now);
  ipRateLimits.set(ip, history);
}

function isAdminBruteForceBlocked(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const history = adminFailLimits.get(ip) || [];
  const valid = history.filter((timestamp) => now - timestamp < windowMs);
  adminFailLimits.set(ip, valid);
  return valid.length >= 5;
}

function recordAdminFailure(ip: string): void {
  const now = Date.now();
  const history = adminFailLimits.get(ip) || [];
  history.push(now);
  adminFailLimits.set(ip, history);
}

function ensureStoreFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function readFeedbackStore(): FeedbackRecord[] {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFeedbackStore(records: FeedbackRecord[]): void {
  ensureStoreFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function generateReferenceId(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i += 1) {
    rand += chars.charAt(randomBytes[i] % chars.length);
  }
  return `FB-${yyyy}${mm}${dd}-${rand}`;
}

function isAuthorizedAdmin(req: IncomingMessage, clientIp: string): boolean {
  if (isAdminBruteForceBlocked(clientIp)) {
    return false;
  }

  const adminKey = process.env.FEEDBACK_ADMIN_KEY || process.env.ADMIN_KEY;
  if (!adminKey || typeof adminKey !== 'string' || adminKey.trim().length === 0) {
    return false;
  }

  const rawHeader = req.headers['x-admin-key'] || req.headers['authorization']?.replace(/^Bearer\s+/, '');
  const clientKey = typeof rawHeader === 'string' ? rawHeader.trim() : '';
  if (!clientKey) {
    recordAdminFailure(clientIp);
    return false;
  }

  const adminBuffer = Buffer.from(adminKey);
  const clientBuffer = Buffer.from(clientKey);

  if (adminBuffer.length !== clientBuffer.length) {
    recordAdminFailure(clientIp);
    return false;
  }

  const match = crypto.timingSafeEqual(adminBuffer, clientBuffer);
  if (!match) {
    recordAdminFailure(clientIp);
    return false;
  }

  return true;
}

function isOriginAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true;
  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '127.0.0.1') {
      return true;
    }
    if (host && parsedOrigin.host === host) {
      return true;
    }
    const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL;
    if (siteUrl) {
      const parsedSite = new URL(siteUrl);
      if (parsedOrigin.host === parsedSite.host) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function setSecurityHeaders(res: ServerResponse, reqOrigin: string | undefined, host: string | undefined): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (reqOrigin && isOriginAllowed(reqOrigin, host)) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export async function handleFeedbackRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/feedback')) {
    return false;
  }

  const reqOrigin = req.headers['origin'] as string | undefined;
  const reqHost = req.headers['host'] as string | undefined;
  setSecurityHeaders(res, reqOrigin, reqHost);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  if (req.method === 'POST' || req.method === 'PATCH') {
    const referer = req.headers['referer'] as string | undefined;
    const origin = req.headers['origin'] as string | undefined;
    const checkOrigin = origin || (referer ? new URL(referer).origin : undefined);
    if (checkOrigin && !isOriginAllowed(checkOrigin, reqHost)) {
      sendJson(res, 403, { success: false, error: 'Cross-origin request forbidden.' });
      return true;
    }
  }

  if (req.method === 'POST' && (url === '/api/feedback' || url === '/api/feedback/')) {
    if (isRateLimited(clientIp)) {
      sendJson(res, 429, {
        success: false,
        error: 'Too many submissions. Maximum 3 feedback submissions per hour from your IP address.'
      });
      return true;
    }

    try {
      const bodyText = await readBody(req);
      const payload = JSON.parse(bodyText);

      if (payload.websiteUrl && String(payload.websiteUrl).length > 0) {
        sendJson(res, 400, { success: false, error: 'Bot submission rejected.' });
        return true;
      }

      const validation = feedbackSubmissionSchema.safeParse(payload);
      if (!validation.success) {
        sendJson(res, 400, {
          success: false,
          error: 'Validation failed.',
          issues: validation.error.issues
        });
        return true;
      }

      const data = validation.data;

      if (data.screenshotUrl && data.screenshotUrl.length > 0) {
        const match = data.screenshotUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
        if (!match) {
          sendJson(res, 400, {
            success: false,
            error: 'Invalid screenshot format. Only JPEG, PNG, or WebP images are permitted.'
          });
          return true;
        }
        const base64Data = match[3];
        const approxBytes = Math.ceil((base64Data.length * 3) / 4);
        if (approxBytes > 3 * 1024 * 1024) {
          sendJson(res, 400, {
            success: false,
            error: 'Screenshot exceeds maximum size limit of 3 MB.'
          });
          return true;
        }
      }

      const isAnon = Boolean(data.anonymous);
      const record: FeedbackRecord = {
        id: `fb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        referenceId: generateReferenceId(),
        type: data.type,
        title: sanitizeText(data.title),
        description: sanitizeText(data.description),
        category: data.category ? sanitizeText(data.category) : null,
        severity: data.severity || null,
        page: data.page ? sanitizeText(data.page) : null,
        stepsToReproduce: data.stepsToReproduce ? sanitizeText(data.stepsToReproduce) : null,
        screenshotUrl: data.screenshotUrl || null,
        name: isAnon ? null : (data.name ? sanitizeText(data.name) : null),
        email: isAnon ? null : (data.email ? sanitizeText(data.email).toLowerCase() : null),
        replyRequested: isAnon ? false : Boolean(data.replyRequested),
        anonymous: isAnon,
        meta: {
          userAgent: data.meta?.userAgent ? sanitizeText(data.meta.userAgent) : undefined,
          viewport: data.meta?.viewport ? sanitizeText(data.meta.viewport) : undefined,
          theme: data.meta?.theme ? sanitizeText(data.meta.theme) : undefined,
          route: data.meta?.route ? sanitizeText(data.meta.route) : undefined,
          timestamp: new Date().toISOString()
        },
        status: 'new',
        internalNote: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existing = readFeedbackStore();
      existing.unshift(record);
      writeFeedbackStore(existing);
      recordSubmission(clientIp);

      sendJson(res, 201, {
        success: true,
        referenceId: record.referenceId,
        id: record.id
      });
      return true;
    } catch {
      sendJson(res, 500, {
        success: false,
        error: 'Unable to process feedback submission at this time.'
      });
      return true;
    }
  }

  if (req.method === 'GET' && (url === '/api/feedback' || url.startsWith('/api/feedback?'))) {
    if (!isAuthorizedAdmin(req, clientIp)) {
      sendJson(res, 401, { success: false, error: 'Unauthorized administrative access.' });
      return true;
    }

    const records = readFeedbackStore();
    sendJson(res, 200, records);
    return true;
  }

  const patchMatch = url.match(/^\/api\/feedback\/([^/?]+)/);
  if (req.method === 'PATCH' && patchMatch) {
    if (!isAuthorizedAdmin(req, clientIp)) {
      sendJson(res, 401, { success: false, error: 'Unauthorized administrative access.' });
      return true;
    }

    const id = patchMatch[1];
    try {
      const bodyText = await readBody(req);
      const patchData = JSON.parse(bodyText);

      const records = readFeedbackStore();
      const index = records.findIndex((r) => r.id === id);

      if (index === -1) {
        sendJson(res, 404, { success: false, error: 'Feedback item not found.' });
        return true;
      }

      const validStatuses: FeedbackStatus[] = ['new', 'in-review', 'resolved', 'rejected'];
      if (patchData.status && validStatuses.includes(patchData.status)) {
        records[index].status = patchData.status;
      }

      if (patchData.internalNote !== undefined) {
        records[index].internalNote = patchData.internalNote ? sanitizeText(patchData.internalNote) : null;
      }

      records[index].updatedAt = new Date().toISOString();
      writeFeedbackStore(records);

      sendJson(res, 200, { success: true, record: records[index] });
      return true;
    } catch {
      sendJson(res, 500, { success: false, error: 'Failed to update feedback item.' });
      return true;
    }
  }

  return false;
}
