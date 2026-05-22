// Quick diagnostic script to test backend → AI service connectivity
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function testAIService() {
    console.log(`\n🔍 Testing AI Service Connection...`);
    console.log(`📍 AI_SERVICE_URL: ${AI_SERVICE_URL}\n`);

    try {
        // Test health endpoint
        console.log(`1️⃣ Testing /health endpoint...`);
        const healthRes = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
        console.log(`✅ Health Check: ${JSON.stringify(healthRes.data)}\n`);

        // Test plan generation
        console.log(`2️⃣ Testing /rag/plan endpoint...`);
        const planRes = await axios.post(`${AI_SERVICE_URL}/rag/plan`, {
            topics: ['JavaScript'],
            goals: 'Learn basics',
            hours_per_week: 5
        }, { timeout: 30000 });
        
        if (planRes.status === 200) {
            console.log(`✅ Plan Generation Successful:\n${planRes.data.plan?.substring(0, 100)}...\n`);
        } else {
            console.log(`⚠️ Unexpected status: ${planRes.status}\n`);
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        if (err.response) {
            console.error(`Response Status: ${err.response.status}`);
            console.error(`Response Data: ${JSON.stringify(err.response.data)}`);
        }
        if (err.code === 'ECONNREFUSED') {
            console.error(`\n⚠️ Connection Refused! AI service might not be running or wrong URL.`);
        }
        if (err.code === 'ENOTFOUND') {
            console.error(`\n⚠️ Host not found! Check the AI_SERVICE_URL is correct.`);
        }
    }
}

testAIService();
