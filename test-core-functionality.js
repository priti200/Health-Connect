// Test Core HealthConnect Functionality
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

async function testCoreAPIs() {
    console.log('🏥 Testing HealthConnect Core APIs');
    console.log('==================================');
    
    let results = { passed: 0, failed: 0, total: 0 };
    
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    try {
        const result = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/health');
        if (result.success) {
            console.log('✅ Health Check: PASSED');
            results.passed++;
        } else {
            console.log('❌ Health Check: FAILED');
            results.failed++;
        }
        results.total++;
    } catch (error) {
        console.log('❌ Health Check: ERROR -', error.message);
        results.failed++;
        results.total++;
    }
    
    // Test 2: User Registration
    console.log('\n2. Testing User Registration...');
    try {
        const userData = {
            fullName: 'Test User Core',
            email: `test.core.${Date.now()}@healthconnect.com`,
            password: 'password123',
            confirmPassword: 'password123',
            role: 'PATIENT'
        };
        
        const result = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success && result.data.token) {
            console.log('✅ User Registration: PASSED');
            console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
            results.passed++;
            
            // Test 3: Get Current User with Token
            console.log('\n3. Testing Get Current User...');
            const userResult = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/users/me', {
                headers: { 'Authorization': `Bearer ${result.data.token}` }
            });
            
            if (userResult.success) {
                console.log('✅ Get Current User: PASSED');
                console.log(`   User: ${userResult.data.fullName}`);
                results.passed++;
            } else {
                console.log('❌ Get Current User: FAILED');
                console.log(`   Status: ${userResult.status}`);
                results.failed++;
            }
            results.total++;
            
        } else {
            console.log('❌ User Registration: FAILED');
            console.log(`   Status: ${result.status}`);
            results.failed++;
        }
        results.total++;
    } catch (error) {
        console.log('❌ User Registration: ERROR -', error.message);
        results.failed++;
        results.total++;
    }
    
    // Test 4: Get Doctors (Public)
    console.log('\n4. Testing Get Doctors...');
    try {
        const result = await makeRequest('https://healthconnect-backend-1026546995867.us-central1.run.app/api/doctors');
        if (result.success) {
            console.log('✅ Get Doctors: PASSED');
            console.log(`   Found: ${result.data.length} doctors`);
            results.passed++;
        } else {
            console.log('❌ Get Doctors: FAILED');
            console.log(`   Status: ${result.status}`);
            results.failed++;
        }
        results.total++;
    } catch (error) {
        console.log('❌ Get Doctors: ERROR -', error.message);
        results.failed++;
        results.total++;
    }
    
    // Test 5: Gemini Medical Assistant
    console.log('\n5. Testing Gemini Medical Assistant...');
    try {
        const result = await makeRequest('https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant', {
            method: 'POST',
            body: JSON.stringify({ message: 'What are the side effects of aspirin?' })
        });
        
        if (result.success && result.data.response) {
            console.log('✅ Gemini Medical Assistant: PASSED');
            console.log(`   Response: ${result.data.response.substring(0, 100)}...`);
            results.passed++;
        } else {
            console.log('❌ Gemini Medical Assistant: FAILED');
            console.log(`   Status: ${result.status}`);
            console.log(`   Error: ${result.data.error || 'Unknown'}`);
            results.failed++;
        }
        results.total++;
    } catch (error) {
        console.log('❌ Gemini Medical Assistant: ERROR -', error.message);
        results.failed++;
        results.total++;
    }
    
    // Summary
    console.log('\n🏥 Core API Test Results');
    console.log('========================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.passed === results.total) {
        console.log('\n🎉 All core APIs are working! Ready for deployment.');
    } else if (results.passed >= results.total * 0.8) {
        console.log('\n✅ Most core APIs are working. Minor issues to fix.');
    } else {
        console.log('\n⚠️ Significant issues found. Backend needs attention.');
    }
    
    return results;
}

testCoreAPIs().catch(console.error);
