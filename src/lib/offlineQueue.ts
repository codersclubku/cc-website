export interface QueuedRegistration {
  idempotencyKey: string;
  eventId: string;
  studentId: string;
  eventTitle: string;
  queuedAt: string;
  status: 'pending' | 'syncing' | 'failed' | 'expired_session';
  lastError?: string;
}

export interface OfflineSyncResult {
  idempotencyKey: string;
  eventId: string;
  eventTitle: string;
  status: 'registered' | 'waitlisted' | 'failed' | 'expired_session';
  message: string;
  confirmationId?: string;
  syncedAt: string;
}

const QUEUE_STORAGE_KEY = 'cc_offline_registration_queue';
const RESULTS_STORAGE_KEY = 'cc_offline_sync_results';

export function getOfflineQueue(): QueuedRegistration[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: Omit<QueuedRegistration, 'idempotencyKey' | 'status'> & { idempotencyKey?: string }): QueuedRegistration {
  const queue = getOfflineQueue();
  const existing = queue.find((q) => q.eventId === item.eventId && q.studentId === item.studentId);
  if (existing) {
    return existing;
  }

  const newItem: QueuedRegistration = {
    ...item,
    idempotencyKey: item.idempotencyKey || `cc-offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    status: 'pending'
  };

  queue.push(newItem);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {}
  return newItem;
}

export function updateOfflineQueueItem(idempotencyKey: string, updates: Partial<QueuedRegistration>): void {
  try {
    const queue = getOfflineQueue();
    const idx = queue.findIndex((q) => q.idempotencyKey === idempotencyKey);
    if (idx >= 0) {
      queue[idx] = { ...queue[idx], ...updates };
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch {}
}

export function removeFromOfflineQueue(idempotencyKey: string): void {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter((q) => q.idempotencyKey !== idempotencyKey);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function isEventQueuedOffline(eventId: string, studentId: string): boolean {
  return getOfflineQueue().some((q) => q.eventId === eventId && q.studentId === studentId);
}

export function getOfflineSyncResults(): OfflineSyncResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addOfflineSyncResult(res: OfflineSyncResult): void {
  try {
    const list = getOfflineSyncResults();
    const filtered = list.filter((r) => r.idempotencyKey !== res.idempotencyKey);
    filtered.unshift(res);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {}
}

export function clearOfflineSyncResults(): void {
  try {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
  } catch {}
}

export async function replayOfflineQueue(
  registerFn: (eventId: string, studentId: string) => Promise<{ success: boolean; code?: string; status?: 'registered' | 'waitlisted'; message: string; confirmation_id?: string }>,
  currentUserId: string | null
): Promise<OfflineSyncResult[]> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return [];

  const results: OfflineSyncResult[] = [];

  for (const item of queue) {
    if (!currentUserId || currentUserId !== item.studentId) {
      updateOfflineQueueItem(item.idempotencyKey, {
        status: 'expired_session',
        lastError: 'Session expired. Please sign in to finalize registration.'
      });
      const res: OfflineSyncResult = {
        idempotencyKey: item.idempotencyKey,
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        status: 'expired_session',
        message: 'Your session expired while offline. Please sign in to complete registration.',
        syncedAt: new Date().toISOString()
      };
      addOfflineSyncResult(res);
      results.push(res);
      continue;
    }

    updateOfflineQueueItem(item.idempotencyKey, { status: 'syncing' });

    try {
      const response = await registerFn(item.eventId, item.studentId);

      if (response.success) {
        removeFromOfflineQueue(item.idempotencyKey);
        const res: OfflineSyncResult = {
          idempotencyKey: item.idempotencyKey,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          status: response.status === 'waitlisted' ? 'waitlisted' : 'registered',
          message: response.message,
          confirmationId: response.confirmation_id,
          syncedAt: new Date().toISOString()
        };
        addOfflineSyncResult(res);
        results.push(res);
      } else {
        if (response.code === 'ALREADY_REGISTERED' || response.code === 'ALREADY_WAITLISTED') {
          removeFromOfflineQueue(item.idempotencyKey);
          const res: OfflineSyncResult = {
            idempotencyKey: item.idempotencyKey,
            eventId: item.eventId,
            eventTitle: item.eventTitle,
            status: response.code === 'ALREADY_WAITLISTED' ? 'waitlisted' : 'registered',
            message: response.message,
            confirmationId: response.confirmation_id,
            syncedAt: new Date().toISOString()
          };
          addOfflineSyncResult(res);
          results.push(res);
        } else {
          updateOfflineQueueItem(item.idempotencyKey, {
            status: 'failed',
            lastError: response.message
          });
          const res: OfflineSyncResult = {
            idempotencyKey: item.idempotencyKey,
            eventId: item.eventId,
            eventTitle: item.eventTitle,
            status: 'failed',
            message: response.message,
            syncedAt: new Date().toISOString()
          };
          addOfflineSyncResult(res);
          results.push(res);
        }
      }
    } catch (err: any) {
      updateOfflineQueueItem(item.idempotencyKey, {
        status: 'failed',
        lastError: err?.message || 'Sync failed'
      });
    }
  }

  return results;
}
