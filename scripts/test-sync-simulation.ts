// Automated Test Suite for AquaPOS Sync & State Preservation
import { describe, it } from 'node:test';
import assert from 'node:assert';

// 1. Simulation of the upsert logic from useStore
function upsertEntities<T extends { id: string }>(
  localList: T[],
  remoteList: any[] | undefined,
  mapFn: (r: any) => T
): T[] {
  const map = new Map<string, T>();
  (localList || []).forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  if (Array.isArray(remoteList)) {
    remoteList.forEach((raw) => {
      const mapped = mapFn(raw);
      if (mapped && mapped.id) {
        map.set(mapped.id, mapped);
      }
    });
  }
  return Array.from(map.values());
}

interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface OutboxRecord {
  id: string;
  type: string;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  payload: any;
  createdAt: string;
}

interface Tombstone {
  entityType: string;
  entityId: string;
  deletedAt: string;
}

function simulateMergeCentralData(
  currentState: {
    branches: Branch[];
    outboxQueue: OutboxRecord[];
    currentBranchId: string;
  },
  centralData: {
    branches?: any[];
    deletedRecords?: Tombstone[];
    serverTime?: string;
  }
) {
  const mergedBranches = upsertEntities(currentState.branches, centralData.branches, (b: any) => ({
    id: b.id,
    code: b.code || '',
    name: b.name || '',
    location: b.location || '',
    isActive: b.isActive !== undefined ? Boolean(b.isActive) : Boolean(b.is_active ?? true),
    createdAt: b.createdAt || b.created_at || new Date().toISOString(),
    updatedAt: b.updatedAt || b.updated_at,
  }));

  const tombstones = centralData.deletedRecords || [];
  const isDeletedRemotely = (entityType: string, id: string, localUpdatedAt?: string): boolean => {
    const ts = tombstones.find((t) => t.entityType === entityType && t.entityId === id);
    if (!ts) return false;
    if (localUpdatedAt && localUpdatedAt > ts.deletedAt) return false;
    return true;
  };

  const finalBranches = mergedBranches.filter(
    (b) => !isDeletedRemotely('branches', b.id, b.updatedAt || b.createdAt)
  );

  const activeBranches = finalBranches.filter((b) => b.isActive !== false);
  const nextBranchId = currentState.currentBranchId && activeBranches.some((b) => b.id === currentState.currentBranchId)
    ? currentState.currentBranchId
    : (activeBranches[0]?.id || '');

  return {
    branches: finalBranches,
    currentBranchId: nextBranchId,
  };
}

console.log('--- RUNNING AUTOMATED SYNC VERIFICATION SUITE ---');

// TEST 1: Saving a branch offline preserves it across empty pull responses
console.log('TEST 1: Branch persistence across empty server pull response...');
const localState1 = {
  branches: [
    {
      id: 'b-lwengo-01',
      code: 'BR-LWG',
      name: 'Lwengo Main Branch',
      location: 'Lwengo Town',
      isActive: true,
      createdAt: '2026-08-17T02:00:00.000Z',
    },
  ],
  outboxQueue: [
    {
      id: 'tx-001',
      type: 'SAVE_BRANCH',
      status: 'PENDING' as const,
      payload: { id: 'b-lwengo-01', name: 'Lwengo Main Branch' },
      createdAt: '2026-08-17T02:00:00.000Z',
    },
  ],
  currentBranchId: 'b-lwengo-01',
};

// Simulate pulling from an empty central database
const pullResult1 = simulateMergeCentralData(localState1, { branches: [] });
assert.strictEqual(pullResult1.branches.length, 1, 'Local branch must NOT be wiped out by empty server array!');
assert.strictEqual(pullResult1.branches[0].name, 'Lwengo Main Branch');
assert.strictEqual(pullResult1.currentBranchId, 'b-lwengo-01', 'currentBranchId must remain set to the branch!');
console.log('  PASSED: Local branch was preserved and currentBranchId remained intact.');

// TEST 2: Incoming remote branch merges cleanly with local branch
console.log('TEST 2: Incoming central server branches union with local state...');
const centralData2 = {
  branches: [
    {
      id: 'b-masaka-02',
      code: 'BR-MSK',
      name: 'Masaka Central Branch',
      location: 'Masaka City',
      is_active: true,
      created_at: '2026-08-17T02:10:00.000Z',
    },
  ],
};
const pullResult2 = simulateMergeCentralData(localState1, centralData2);
assert.strictEqual(pullResult2.branches.length, 2, 'Must have 2 branches after merging remote branch!');
const ids = pullResult2.branches.map(b => b.id);
assert.ok(ids.includes('b-lwengo-01') && ids.includes('b-masaka-02'), 'Both local and remote branches must exist in state!');
console.log('  PASSED: Both local and remote branches successfully merged.');

// TEST 3: Auto-select active branch when currentBranchId was empty
console.log('TEST 3: Auto-selection of active branch when currentBranchId is unset...');
const emptyBranchState = {
  branches: [],
  outboxQueue: [],
  currentBranchId: '',
};
const pullResult3 = simulateMergeCentralData(emptyBranchState, centralData2);
assert.strictEqual(pullResult3.currentBranchId, 'b-masaka-02', 'Should auto-select the first available active branch!');
console.log('  PASSED: Auto-selected active branch so user never sees "No branch configured".');

// TEST 4: Tombstone deletion correctly removes branch when tombstone is newer
console.log('TEST 4: Remote tombstone deletion removes branch only when newer...');
const centralData4 = {
  branches: [],
  deletedRecords: [
    {
      entityType: 'branches',
      entityId: 'b-lwengo-01',
      deletedAt: '2026-08-17T02:30:00.000Z', // Newer than createdAt 02:00:00
    },
  ],
};
const pullResult4 = simulateMergeCentralData(localState1, centralData4);
assert.strictEqual(pullResult4.branches.length, 0, 'Branch must be deleted when remote tombstone is newer!');
console.log('  PASSED: Remote tombstone correctly cleaned up deleted record.');

console.log('--- ALL AUTOMATED SYNC UNIT TESTS PASSED SUCCESSFULLY! ---');
