// Live Verification Test: Automated Fill-in to Neon PostgreSQL via Render Sync Ingestion
import axios from 'axios';
import https from 'node:https';
import { v4 as uuidv4 } from 'uuid';

const RENDER_BASE_URL = 'https://aquapos-nsw3.onrender.com';
const client = axios.create({
  baseURL: RENDER_BASE_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

async function runLiveNeonVerification() {
  console.log('====================================================');
  console.log('🚀 LIVE NEON POSTGRESQL AUTOMATED SYNC VERIFICATION');
  console.log(`Target Backend: ${RENDER_BASE_URL}`);
  console.log('====================================================\n');

  // Step 1: Health Check & Current Count
  console.log('Step 1: Checking Live Health & Database Connection...');
  const healthRes1 = await client.get(`/api/v1/health`);
  console.log('Health Status:', healthRes1.data);

  if (!healthRes1.data.databaseConnected) {
    throw new Error('Neon database is not connected on Render!');
  }
  const initialCount = healthRes1.data.branchCount;
  console.log(`Initial Branch Count in Neon: ${initialCount}\n`);

  // Step 2: Automated Branch Creation Payload (Simulating Desktop Outbox Ingestion)
  const testBranchId = uuidv4();
  const testBranchCode = `BR-NEON-${Math.floor(1000 + Math.random() * 9000)}`;
  const testBranchName = `Neon Live Branch (${testBranchCode})`;

  console.log(`Step 2: Sending Automated Outbox Ingestion for Branch: "${testBranchName}" (ID: ${testBranchId})...`);
  const ingestPayload = {
    branchId: testBranchId,
    deviceId: 'automated-test-runner-01',
    transactions: [
      {
        id: uuidv4(),
        transactionType: 'SAVE_BRANCH',
        payload: {
          id: testBranchId,
          code: testBranchCode,
          name: testBranchName,
          location: 'Kampala Highway Plot 4',
          isActive: true,
        },
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const ingestRes = await client.post(`/api/v1/sync/ingest`, ingestPayload);
  console.log('Ingest Response:', ingestRes.data);

  if (!ingestRes.data.success || !ingestRes.data.results?.[0]?.status.includes('ACK')) {
    throw new Error(`Ingest failed: ${JSON.stringify(ingestRes.data)}`);
  }
  console.log('✔ Ingest Transaction ACK acknowledged by Render & Neon.\n');

  // Step 3: Pull Data from Neon Central Database
  console.log('Step 3: Pulling Central Data from Neon to Verify Storage...');
  const pullRes = await client.get(`/api/v1/sync/pull?branchId=${testBranchId}`);
  console.log(`Pull returned ${pullRes.data?.data?.branches?.length || 0} branches from Neon.`);

  const foundBranch = (pullRes.data?.data?.branches || []).find((b: any) => b.id === testBranchId || b.code === testBranchCode);

  if (!foundBranch) {
    throw new Error(`Branch with ID ${testBranchId} was not found in Neon pull response!`);
  }
  console.log('✔ Found Branch stored in Neon PostgreSQL:', foundBranch, '\n');

  // Step 4: Verify Final Neon Database Health Count
  console.log('Step 4: Verifying Updated Branch Count in Neon Health API...');
  const healthRes2 = await client.get(`/api/v1/health`);
  console.log('Final Health Status:', healthRes2.data);
  const finalCount = healthRes2.data.branchCount;

  if (finalCount <= initialCount) {
    throw new Error(`Branch count in Neon did not increment! (Before: ${initialCount}, After: ${finalCount})`);
  }

  console.log('\n====================================================');
  console.log(`🎉 SUCCESS! Branch was permanently saved in Neon PostgreSQL!`);
  console.log(`   Database Engine: ${healthRes2.data.databaseEngine}`);
  console.log(`   Total Branches in Neon: ${finalCount}`);
  console.log('====================================================\n');
}

runLiveNeonVerification().catch((err) => {
  console.error('❌ LIVE NEON VERIFICATION FAILED:', err?.response?.data || err.message);
  process.exit(1);
});
