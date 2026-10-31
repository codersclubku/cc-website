import type {
  FeedbackRecord,
  FeedbackSubmissionPayload,
  FeedbackStatus,
  FeedbackMeta,
} from '../types/feedback';

const LOCAL_STORAGE_KEY = 'cc-local-feedback-store';

export const AUTHORIZED_FEEDBACK_ADMIN_EMAILS = [
  'vittala.t1@gmail.com',
  'dvnsabhiram071@gmail.com',
  'vannurswamy@kishkindauniversity.edu.in',
  'anusha@kishkindauniversity.edu.in',
];

export function isAuthorizedFeedbackAdmin(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  const normalized = userEmail.toLowerCase().trim();
  return AUTHORIZED_FEEDBACK_ADMIN_EMAILS.includes(normalized);
}

export function captureClientMeta(theme?: string, currentRoute?: string): FeedbackMeta {
  if (typeof window === 'undefined') {
    return {
      timestamp: new Date().toISOString(),
    };
  }
  return {
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    theme: theme || 'system',
    route: currentRoute || window.location.pathname,
    timestamp: new Date().toISOString(),
  };
}

export async function downscaleImage(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are permitted.');
  }

  const maxBytes = 3 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Screenshot must not exceed 3 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image element.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function getLocalStore(): FeedbackRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStore(records: FeedbackRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {
  }
}

function generateLocalReferenceId(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i += 1) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FB-${yyyy}${mm}${dd}-${rand}`;
}

export async function submitFeedback(
  payload: FeedbackSubmissionPayload
): Promise<{ success: boolean; referenceId?: string; id?: string; error?: string }> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Submission failed with status ${res.status}`,
      };
    }

    return {
      success: true,
      referenceId: data?.referenceId,
      id: data?.id,
    };
  } catch {
    const isAnon = Boolean(payload.anonymous);
    const localRef = generateLocalReferenceId();
    const localRecord: FeedbackRecord = {
      id: `fb_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      referenceId: localRef,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      category: payload.category || null,
      severity: payload.severity || null,
      page: payload.page || null,
      stepsToReproduce: payload.stepsToReproduce || null,
      screenshotUrl: payload.screenshotUrl || null,
      name: isAnon ? null : payload.name || null,
      email: isAnon ? null : payload.email || null,
      replyRequested: isAnon ? false : Boolean(payload.replyRequested),
      anonymous: isAnon,
      meta: payload.meta || {},
      status: 'new',
      internalNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = getLocalStore();
    store.unshift(localRecord);
    saveLocalStore(store);

    return {
      success: true,
      referenceId: localRef,
      id: localRecord.id,
    };
  }
}

export async function getFeedbackList(adminKey?: string): Promise<FeedbackRecord[]> {
  try {
    const headers: Record<string, string> = {};
    if (adminKey) {
      headers['x-admin-key'] = adminKey;
    }
    const res = await fetch('/api/feedback', { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
  }
  return getLocalStore();
}

export async function updateFeedbackItem(
  id: string,
  updates: { status?: FeedbackStatus; internalNote?: string | null },
  adminKey?: string
): Promise<{ success: boolean; record?: FeedbackRecord; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (adminKey) {
      headers['x-admin-key'] = adminKey;
    }
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      return { success: true, record: data.record };
    }
    if (!res.ok) {
      return { success: false, error: data?.error || 'Failed to update record' };
    }
  } catch {
  }

  const store = getLocalStore();
  const idx = store.findIndex((r) => r.id === id);
  if (idx !== -1) {
    if (updates.status) store[idx].status = updates.status;
    if (updates.internalNote !== undefined) store[idx].internalNote = updates.internalNote;
    store[idx].updatedAt = new Date().toISOString();
    saveLocalStore(store);
    return { success: true, record: store[idx] };
  }

  return { success: false, error: 'Feedback record not found.' };
}
