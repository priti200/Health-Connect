// Test the correct API endpoints
const https = require('https');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = https.request({
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...options.headers }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, success: res.statusCode < 300 });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, success: res.statusCode < 300 });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function testCorrectEndpoints() {
    console.log('🔍 Testing Correct API Endpoints...');
    
    // Test public doctors endpoint
    console.log('\n👨‍⚕️ Testing /api/doctors (public)...');
    try {
        const result = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/doctors');
        console.log(`Status: ${result.status}`);
        if (result.success) {
            console.log('✅ Public doctors endpoint working');
            console.log(`Found ${result.data.length || 0} doctors`);
        } else {
            console.log('❌ Public doctors endpoint failed');
            console.log(`Data: ${JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Test Gemini with text-only query
    console.log('\n🧠 Testing Gemini API with text query...');
    try {
        const result = await makeRequest('https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant', {
            method: 'POST',
            body: JSON.stringify({ 
                message: 'What are the side effects of aspirin and when should I avoid taking it?'
            })
        });
        console.log(`Status: ${result.status}`);
        if (result.success && result.data.response) {
            console.log('✅ Gemini API working with text query');
            console.log(`Response: ${result.data.response.substring(0, 150)}...`);
        } else {
            console.log('❌ Gemini API failed');
            console.log(`Error: ${result.data.error || 'Unknown'}`);
            console.log(`Full response: ${JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    // Test with a valid JWT token from our previous registration
    console.log('\n🔐 Testing with valid JWT token...');
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsInN1YiI6InRlc3QuYXBpLjE3MzQ3MzE5NzE5NjRAaGVhbHRoY29ubmVjdC5jb20iLCJpYXQiOjE3MzQ3MzE5NzIsImV4cCI6MTczNDgxODM3Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // From previous test
    
    try {
        const result = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Status: ${result.status}`);
        if (result.success) {
            console.log('✅ JWT authentication working');
            console.log(`User: ${result.data.fullName} (${result.data.email})`);
        } else {
            console.log('❌ JWT authentication failed');
            console.log(`Error: ${JSON.stringify(result.data)}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

testCorrectEndpoints().catch(console.error);
