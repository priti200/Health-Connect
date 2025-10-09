// Simple API Testing Script for HealthConnect
// Run with: node test-apis-simple.js

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://healthconnect-backend-1026546995867.us-central1.run.app';
const GEMINI_URL = 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant';

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'HealthConnect-API-Test/1.0',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ 
                        status: res.statusCode, 
                        data: jsonData, 
                        success: res.statusCode >= 200 && res.statusCode < 300 
                    });
                } catch (e) {
                    resolve({ 
                        status: res.statusCode, 
                        data: data, 
                        success: res.statusCode >= 200 && res.statusCode < 300 
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Test functions
async function testHealthCheck() {
    console.log('\n🏥 Testing Backend Health Check...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/health`);
        if (result.success) {
            console.log('✅ Backend Health Check: PASSED');
            console.log(`   Response: ${result.data}`);
            return true;
        } else {
            console.log('❌ Backend Health Check: FAILED');
            console.log(`   Status: ${result.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend Health Check: ERROR');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testGeminiAPI() {
    console.log('\n🧠 Testing Gemini Medical Assistant API...');
    try {
        const testMessage = {
            message: "What are the common side effects of aspirin and when should I avoid taking it?"
        };

        const result = await makeRequest(GEMINI_URL, {
            method: 'POST',
            body: JSON.stringify(testMessage)
        });

        if (result.success && result.data.response) {
            console.log('✅ Gemini Medical Assistant API: PASSED');
            console.log(`   Response preview: ${result.data.response.substring(0, 150)}...`);
            return true;
        } else {
            console.log('❌ Gemini Medical Assistant API: FAILED');
            console.log(`   Status: ${result.status}`);
            console.log(`   Data: ${JSON.stringify(result.data)}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Gemini Medical Assistant API: ERROR');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testDoctorsEndpoint() {
    console.log('\n👨‍⚕️ Testing Get Doctors Endpoint...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/users/doctors`);
        if (result.success) {
            console.log('✅ Get Doctors Endpoint: PASSED');
            console.log(`   Found ${result.data.length} doctors`);
            if (result.data.length > 0) {
                console.log(`   Sample doctor: ${result.data[0].fullName || 'N/A'}`);
            }
            return true;
        } else {
            console.log('❌ Get Doctors Endpoint: FAILED');
            console.log(`   Status: ${result.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Get Doctors Endpoint: ERROR');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testCORS() {
    console.log('\n🌐 Testing CORS Configuration...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });

        if (result.status === 200 || result.status === 204) {
            console.log('✅ CORS Configuration: PASSED');
            console.log(`   Status: ${result.status}`);
            return true;
        } else {
            console.log('❌ CORS Configuration: FAILED');
            console.log(`   Status: ${result.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ CORS Configuration: ERROR');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testRegistration() {
    console.log('\n📝 Testing User Registration...');
    try {
        const userData = {
            fullName: 'API Test User',
            email: `test.api.${Date.now()}@healthconnect.com`,
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
            console.log('✅ User Registration: PASSED');
            console.log(`   User: ${result.data.fullName} (${result.data.role})`);
            console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
            return { success: true, token: result.data.token };
        } else {
            console.log('❌ User Registration: FAILED');
            console.log(`   Status: ${result.status}`);
            console.log(`   Message: ${result.data.message || 'Unknown error'}`);
            return { success: false };
        }
    } catch (error) {
        console.log('❌ User Registration: ERROR');
        console.log(`   Error: ${error.message}`);
        return { success: false };
    }
}

async function testWithAuth(token) {
    console.log('\n🔐 Testing Authenticated Endpoints...');
    
    // Test get current user
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (result.success) {
            console.log('✅ Get Current User: PASSED');
            console.log(`   User: ${result.data.fullName} (${result.data.email})`);
        } else {
            console.log('❌ Get Current User: FAILED');
            console.log(`   Status: ${result.status}`);
        }
    } catch (error) {
        console.log('❌ Get Current User: ERROR');
        console.log(`   Error: ${error.message}`);
    }

    // Test AI Health Bot
    try {
        const chatData = {
            message: "I have a headache and feel tired. What could be the cause?",
            isNewConversation: true
        };

        const result = await makeRequest(`${BACKEND_URL}/api/ai-health-bot/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(chatData)
        });

        if (result.success && result.data.aiResponse) {
            console.log('✅ AI Health Bot: PASSED');
            console.log(`   AI Response: ${result.data.aiResponse.substring(0, 100)}...`);
        } else {
            console.log('❌ AI Health Bot: FAILED');
            console.log(`   Status: ${result.status}`);
        }
    } catch (error) {
        console.log('❌ AI Health Bot: ERROR');
        console.log(`   Error: ${error.message}`);
    }
}

// Main test runner
async function runTests() {
    console.log('🏥 HealthConnect API Testing Suite');
    console.log('==================================');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Test 1: Health Check
    const healthResult = await testHealthCheck();
    results.total++;
    if (healthResult) results.passed++; else results.failed++;

    // Test 2: CORS
    const corsResult = await testCORS();
    results.total++;
    if (corsResult) results.passed++; else results.failed++;

    // Test 3: Gemini API
    const geminiResult = await testGeminiAPI();
    results.total++;
    if (geminiResult) results.passed++; else results.failed++;

    // Test 4: Doctors endpoint
    const doctorsResult = await testDoctorsEndpoint();
    results.total++;
    if (doctorsResult) results.passed++; else results.failed++;

    // Test 5: Registration
    const regResult = await testRegistration();
    results.total++;
    if (regResult.success) {
        results.passed++;
        
        // Test authenticated endpoints if registration succeeded
        await testWithAuth(regResult.token);
    } else {
        results.failed++;
    }

    // Print summary
    console.log('\n🏥 Test Results Summary');
    console.log('======================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! HealthConnect API is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the backend deployment status.');
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testGeminiAPI, testHealthCheck };
