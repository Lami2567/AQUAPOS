import { apiClient } from '../utils/api';
import { useStore } from '../store/useStore';

class SyncManager {
  private isSyncing = false;
  private syncTimer: any = null;

  public init() {
    // Listen to browser network connectivity changes
    window.addEventListener('online', () => {
      useStore.getState().setOnlineStatus(true);
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      useStore.getState().setOnlineStatus(false);
      useStore.getState().setSyncStatus('OFFLINE');
    });

    // Auto-sync poll interval (every 30 seconds when online)
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, 30000);

    // Initial sync trigger on boot
    if (navigator.onLine) {
      setTimeout(() => this.triggerSync(), 1500);
    }
  }

  public async triggerSync(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync is already in progress' };
    }

    const store = useStore.getState();
    if (!navigator.onLine) {
      store.setOnlineStatus(false);
      store.setSyncStatus('OFFLINE', store.outboxQueue.filter((o) => o.status === 'PENDING').length);
      return { success: false, message: 'Working offline' };
    }

    this.isSyncing = true;
    store.setSyncStatus('SYNCING');

    try {
      // 1. PUSH: Push pending outbox transactions to central server
      const pendingOutbox = store.outboxQueue.filter((item) => item.status === 'PENDING');
      const branchId = store.currentBranchId || 'b1111111-1111-1111-1111-111111111111';
      const deviceId = (import.meta.env.VITE_DEVICE_ID as string) || 'web-admin-01';

      if (pendingOutbox.length > 0) {
        const transactions = pendingOutbox.map((o: any) => ({
          id: o.id,
          transactionType: o.type,
          payload: o.payload || o,
          createdAt: o.createdAt || new Date().toISOString(),
        }));

        const pushRes = await apiClient.post('/api/v1/sync/ingest', {
          branchId,
          deviceId,
          transactions,
        });

        if (pushRes.data?.success && Array.isArray(pushRes.data?.results)) {
          const ackedIds = pushRes.data.results
            .filter((r: any) => r.status === 'ACK' || r.status === 'DUPLICATE')
            .map((r: any) => r.id);
          store.markOutboxSynced(ackedIds);
        }
      }

      // 2. PULL: Pull latest central master data and inventory
      const sinceParam = store.lastSyncedAt ? `&since=${encodeURIComponent(store.lastSyncedAt)}` : '';
      const pullRes = await apiClient.get(`/api/v1/sync/pull?branchId=${branchId}${sinceParam}`);
      if (pullRes.data?.success && pullRes.data?.data) {
        store.mergeCentralData(pullRes.data.data);
      }

      const remainingPending = store.outboxQueue.filter((o) => o.status === 'PENDING').length;
      store.setOnlineStatus(true);
      store.setSyncStatus('SYNCED', remainingPending);
      this.isSyncing = false;

      return {
        success: true,
        message: `Synchronized successfully! Central data updated (${pendingOutbox.length} pushed).`,
      };
    } catch (err: any) {
      console.warn('Background sync encountered network or server delay:', err?.message || err);
      const remainingPending = store.outboxQueue.filter((o) => o.status === 'PENDING').length;
      store.setSyncStatus('ONLINE', remainingPending);
      this.isSyncing = false;
      return {
        success: false,
        message: `Sync delayed: ${err?.message || 'Server unreachable'}. Working in local offline mode.`,
      };
    }
  }
}

export const syncManager = new SyncManager();
