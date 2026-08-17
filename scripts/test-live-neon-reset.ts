// Automated Test for Production Reset Endpoint against Live Render & Neon PostgreSQL
import axios from 'axios';
import https from 'node:https';

const RENDER_BASE_URL = 'https://aquapos-nsw3.onrender.com';
const client = axios.create({
  baseURL: RENDER_BASE_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

async function runLiveResetVerification() {
  console.log('====================================================');
  console.log('🚀 LIVE RESET ENDPOINT AUTOMATED VERIFICATION');
  console.log(`Target Backend: ${RENDER_BASE_URL}`);
  console.log('====================================================\n');

  console.log('Testing POST /api/v1/admin/reset-production (clearDemoMaster = false)...');
  const res1 = await client.post('/api/v1/admin/reset-production', { clearDemoMaster: false });
  console.log('Response:', res1.data);

  if (!res1.data.success) {
    throw new Error(`Reset endpoint failed: ${JSON.stringify(res1.data)}`);
  }
  console.log('✔ Live reset-production endpoint succeeded with HTTP 200!');

  console.log('\n====================================================');
  console.log('🎉 PRODUCTION RESET ENDPOINT VERIFIED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runLiveResetVerification().catch((err) => {
  console.error('❌ LIVE RESET VERIFICATION FAILED:', err?.response?.data || err.message);
  process.exit(1);
});
