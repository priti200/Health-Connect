// Comprehensive Test for Fixed HealthConnect Backend
const https = require('https');

const BACKEND_URL = 'https://healthconnect-backend-1026546995867.us-central1.run.app';
const GEMINI_URL = 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant';

let authToken = null;

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

async function testFixedBackend() {
    console.log('🏥 Testing Fixed HealthConnect Backend');
    console.log('=====================================');
    
    let results = { passed: 0, failed: 0, total: 0, details: [] };
    
    function logResult(test, success, message) {
        results.total++;
        if (success) {
            results.passed++;
            console.log(`✅ ${test}: PASSED - ${message}`);
        } else {
            results.failed++;
            console.log(`❌ ${test}: FAILED - ${message}`);
        }
        results.details.push({ test, success, message });
    }
    
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/health`);
        logResult('Health Check', result.success, result.success ? 'Backend online' : `Status: ${result.status}`);
    } catch (error) {
        logResult('Health Check', false, error.message);
    }
    
    // Test 2: User Registration
    console.log('\n2. Testing User Registration...');
    try {
        const userData = {
            fullName: 'Fixed Test User',
            email: `test.fixed.${Date.now()}@healthconnect.com`,
            password: 'password123',
            confirmPassword: 'password123',
            role: 'PATIENT',
            phoneNumber: '+1234567890'
        };
        
        const result = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success && result.data.token) {
            authToken = result.data.token;
            logResult('User Registration', true, `User created: ${result.data.fullName}`);
        } else {
            logResult('User Registration', false, `Status: ${result.status}, Message: ${result.data.message || 'Unknown'}`);
        }
    } catch (error) {
        logResult('User Registration', false, error.message);
    }
    
    // Test 3: JWT Authentication (Get Current User)
    console.log('\n3. Testing JWT Authentication...');
    if (authToken) {
        try {
            const result = await makeRequest(`${BACKEND_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (result.success) {
                logResult('JWT Authentication', true, `Authenticated user: ${result.data.fullName}`);
            } else {
                logResult('JWT Authentication', false, `Status: ${result.status}, Token validation failed`);
            }
        } catch (error) {
            logResult('JWT Authentication', false, error.message);
        }
    } else {
        logResult('JWT Authentication', false, 'No auth token available');
    }
    
    // Test 4: AI Health Bot (Authenticated)
    console.log('\n4. Testing AI Health Bot...');
    if (authToken) {
        try {
            const chatData = {
                message: "I have been experiencing headaches and fatigue. What could be causing this?",
                isNewConversation: true
            };
            
            const result = await makeRequest(`${BACKEND_URL}/api/ai-health-bot/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(chatData)
            });
            
            if (result.success && result.data.aiResponse) {
                logResult('AI Health Bot', true, `AI responded: ${result.data.aiResponse.substring(0, 50)}...`);
            } else {
                logResult('AI Health Bot', false, `Status: ${result.status}, Message: ${result.data.message || 'No response'}`);
            }
        } catch (error) {
            logResult('AI Health Bot', false, error.message);
        }
    } else {
        logResult('AI Health Bot', false, 'No auth token available');
    }
    
    // Test 5: Get Doctors (Public)
    console.log('\n5. Testing Get Doctors...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/doctors`);
        if (result.success) {
            logResult('Get Doctors', true, `Found ${result.data.length} doctors`);
        } else {
            logResult('Get Doctors', false, `Status: ${result.status}`);
        }
    } catch (error) {
        logResult('Get Doctors', false, error.message);
    }
    
    // Test 6: Gemini Text Query (New Endpoint)
    console.log('\n6. Testing Gemini Text Query...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/gemini/query`, {
            method: 'POST',
            body: JSON.stringify({ message: 'What are the side effects of aspirin?' })
        });
        
        if (result.success) {
            logResult('Gemini Text Query', true, 'Text query endpoint working');
        } else {
            logResult('Gemini Text Query', false, `Status: ${result.status}`);
        }
    } catch (error) {
        logResult('Gemini Text Query', false, error.message);
    }
    
    // Test 7: Gemini Direct API
    console.log('\n7. Testing Gemini Direct API...');
    try {
        const result = await makeRequest(GEMINI_URL, {
            method: 'POST',
            body: JSON.stringify({ message: 'What are the side effects of aspirin?' })
        });
        
        if (result.success && result.data.response) {
            logResult('Gemini Direct API', true, 'Direct API working');
        } else {
            logResult('Gemini Direct API', false, `Status: ${result.status}, Error: ${result.data.error || 'Unknown'}`);
        }
    } catch (error) {
        logResult('Gemini Direct API', false, error.message);
    }
    
    // Test 8: Create Appointment (Authenticated)
    console.log('\n8. Testing Create Appointment...');
    if (authToken) {
        try {
            // First get a doctor
            const doctorsResult = await makeRequest(`${BACKEND_URL}/api/doctors`);
            if (doctorsResult.success && doctorsResult.data.length > 0) {
                const doctorId = doctorsResult.data[0].id;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const appointmentData = {
                    doctorId: doctorId,
                    date: tomorrow.toISOString().split('T')[0],
                    startTime: "10:00",
                    endTime: "10:30",
                    type: "VIDEO_CALL",
                    reasonForVisit: "Fixed Backend Test"
                };
                
                const result = await makeRequest(`${BACKEND_URL}/api/appointments`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(appointmentData)
                });
                
                if (result.success) {
                    logResult('Create Appointment', true, `Appointment created: ${result.data.id}`);
                } else {
                    logResult('Create Appointment', false, `Status: ${result.status}, Message: ${result.data.message || 'Unknown'}`);
                }
            } else {
                logResult('Create Appointment', false, 'No doctors available');
            }
        } catch (error) {
            logResult('Create Appointment', false, error.message);
        }
    } else {
        logResult('Create Appointment', false, 'No auth token available');
    }
    
    // Summary
    console.log('\n🏥 Fixed Backend Test Results');
    console.log('=============================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.passed === results.total) {
        console.log('\n🎉 ALL TESTS PASSED! Backend is 100% functional!');
    } else if (results.passed >= results.total * 0.9) {
        console.log('\n🎯 Excellent! 90%+ functionality achieved!');
    } else if (results.passed >= results.total * 0.8) {
        console.log('\n✅ Good progress! 80%+ functionality achieved!');
    } else {
        console.log('\n⚠️ More work needed to achieve target functionality.');
    }
    
    // Detailed breakdown
    console.log('\n📋 Detailed Results:');
    results.details.forEach((detail, index) => {
        const status = detail.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return results;
}

testFixedBackend().catch(console.error);
