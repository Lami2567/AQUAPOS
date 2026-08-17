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

    // High-frequency local SQLite auto-sync poll interval (every 3 seconds)
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      this.triggerSync();
    }, 3000);

    // Immediate initial sync trigger on boot (0ms delay) to populate SQLite data into state
    this.triggerSync();
  }

  public async triggerSync(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync is already in progress' };
    }

    const store = useStore.getState();

    this.isSyncing = true;

    try {
      // 1. PUSH: Push pending outbox transactions to local NestJS SQLite & central server
      const pendingOutbox = store.outboxQueue.filter((item) => item.status === 'PENDING');
      const branchId = store.currentBranchId || '';
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

      // 2. PULL: Pull latest master data and inventory directly from SQLite database
      const sinceParam = store.lastSyncedAt ? `&since=${encodeURIComponent(store.lastSyncedAt)}` : '';
      const pullUrl = branchId ? `/api/v1/sync/pull?branchId=${branchId}${sinceParam}` : `/api/v1/sync/pull${sinceParam ? `?${sinceParam.slice(1)}` : ''}`;
      const pullRes = await apiClient.get(pullUrl);
      
      if (pullRes.data?.success && pullRes.data?.data) {
        store.mergeCentralData(pullRes.data.data);
      }

      const remainingPending = store.outboxQueue.filter((o) => o.status === 'PENDING').length;
      store.setOnlineStatus(true);
      store.setSyncStatus('SYNCED', remainingPending);
      this.isSyncing = false;

      return {
        success: true,
        message: `Synchronized successfully with SQLite database! (${pendingOutbox.length} pushed).`,
      };
    } catch (err: any) {
      const remainingPending = store.outboxQueue.filter((o) => o.status === 'PENDING').length;
      store.setSyncStatus('OFFLINE', remainingPending);
      this.isSyncing = false;
      return {
        success: false,
        message: `Sync delayed: ${err?.message || 'Server unreachable'}. Working in local mode.`,
      };
    }
  }
}

export const syncManager = new SyncManager();
