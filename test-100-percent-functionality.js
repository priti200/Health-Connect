// Final Test for 100% HealthConnect Backend Functionality
const https = require('https');

const BACKEND_URL = 'https://healthconnect-backend-1026546995867.us-central1.run.app';
const GEMINI_URL = 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant';

let authToken = null;
let userId = null;

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

async function test100PercentFunctionality() {
    console.log('🏥 HealthConnect Backend - 100% Functionality Test');
    console.log('==================================================');
    
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
    console.log('\n🔍 1. Testing Health Check...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/health`);
        logResult('Health Check', result.success, result.success ? 'Backend online' : `Status: ${result.status}`);
    } catch (error) {
        logResult('Health Check', false, error.message);
    }
    
    // Test 2: User Registration
    console.log('\n👤 2. Testing User Registration...');
    try {
        const userData = {
            fullName: 'Final Test User',
            email: `test.final.${Date.now()}@healthconnect.com`,
            password: 'password123',
            confirmPassword: 'password123',
            role: 'PATIENT',
            phoneNumber: '+1234567890',
            address: '123 Test Street, Test City'
        };
        
        const result = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (result.success && result.data.token) {
            authToken = result.data.token;
            userId = result.data.id;
            logResult('User Registration', true, `User created: ${result.data.fullName} (ID: ${userId})`);
        } else {
            logResult('User Registration', false, `Status: ${result.status}, Message: ${result.data.message || 'Unknown'}`);
        }
    } catch (error) {
        logResult('User Registration', false, error.message);
    }
    
    // Test 3: User Login
    console.log('\n🔐 3. Testing User Login...');
    if (authToken) {
        try {
            const loginData = {
                email: 'patient.test@healthconnect.com',
                password: 'password123'
            };
            
            const result = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            
            if (result.success && result.data.token) {
                logResult('User Login', true, `Login successful: ${result.data.fullName}`);
            } else {
                logResult('User Login', false, `Status: ${result.status}, Message: ${result.data.message || 'Unknown'}`);
            }
        } catch (error) {
            logResult('User Login', false, error.message);
        }
    } else {
        logResult('User Login', false, 'No registration token available');
    }
    
    // Test 4: JWT Authentication (Get Current User)
    console.log('\n🎫 4. Testing JWT Authentication...');
    if (authToken) {
        try {
            const result = await makeRequest(`${BACKEND_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (result.success) {
                logResult('JWT Authentication', true, `Authenticated user: ${result.data.fullName} (${result.data.role})`);
            } else {
                logResult('JWT Authentication', false, `Status: ${result.status}, Token validation failed`);
            }
        } catch (error) {
            logResult('JWT Authentication', false, error.message);
        }
    } else {
        logResult('JWT Authentication', false, 'No auth token available');
    }
    
    // Test 5: AI Health Bot
    console.log('\n🤖 5. Testing AI Health Bot...');
    if (authToken) {
        try {
            const chatData = {
                message: "I have been experiencing persistent headaches and fatigue for the past week. What could be causing this?",
                isNewConversation: true,
                conversationType: "GENERAL_HEALTH"
            };
            
            const result = await makeRequest(`${BACKEND_URL}/api/ai-health-bot/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(chatData)
            });
            
            if (result.success && result.data.aiResponse) {
                logResult('AI Health Bot', true, `AI responded with ${result.data.aiResponse.length} characters`);
            } else {
                logResult('AI Health Bot', false, `Status: ${result.status}, Message: ${result.data.message || 'No response'}`);
            }
        } catch (error) {
            logResult('AI Health Bot', false, error.message);
        }
    } else {
        logResult('AI Health Bot', false, 'No auth token available');
    }
    
    // Test 6: Get Doctors (Public)
    console.log('\n👨‍⚕️ 6. Testing Get Doctors...');
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
    
    // Test 7: Create Appointment
    console.log('\n📅 7. Testing Create Appointment...');
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
                    startTime: "14:00",
                    endTime: "14:30",
                    type: "VIDEO_CALL",
                    reasonForVisit: "Final functionality test appointment"
                };
                
                const result = await makeRequest(`${BACKEND_URL}/api/appointments`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(appointmentData)
                });
                
                if (result.success) {
                    logResult('Create Appointment', true, `Appointment created with Dr. ${doctorsResult.data[0].fullName}`);
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
    
    // Test 8: Get Appointments
    console.log('\n📋 8. Testing Get Appointments...');
    if (authToken) {
        try {
            const result = await makeRequest(`${BACKEND_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (result.success) {
                logResult('Get Appointments', true, `Found ${result.data.length} appointments`);
            } else {
                logResult('Get Appointments', false, `Status: ${result.status}, Message: ${result.data.message || 'Unknown'}`);
            }
        } catch (error) {
            logResult('Get Appointments', false, error.message);
        }
    } else {
        logResult('Get Appointments', false, 'No auth token available');
    }
    
    // Test 9: Gemini Medical Assistant (Direct)
    console.log('\n🧠 9. Testing Gemini Medical Assistant (Direct)...');
    try {
        const result = await makeRequest(GEMINI_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                message: 'What are the common side effects of aspirin and when should I avoid taking it?' 
            })
        });
        
        if (result.success && result.data.response) {
            logResult('Gemini Direct API', true, `Response received (${result.data.response.length} characters)`);
        } else {
            logResult('Gemini Direct API', false, `Status: ${result.status}, Error: ${result.data.error || 'Unknown'}`);
        }
    } catch (error) {
        logResult('Gemini Direct API', false, error.message);
    }
    
    // Test 10: Gemini Proxy (Backend)
    console.log('\n🔄 10. Testing Gemini Proxy (Backend)...');
    try {
        const result = await makeRequest(`${BACKEND_URL}/api/gemini/query`, {
            method: 'POST',
            body: JSON.stringify({ 
                message: 'What are the benefits and risks of taking vitamin D supplements?' 
            })
        });
        
        if (result.success) {
            logResult('Gemini Proxy', true, 'Backend proxy working');
        } else {
            logResult('Gemini Proxy', false, `Status: ${result.status}`);
        }
    } catch (error) {
        logResult('Gemini Proxy', false, error.message);
    }
    
    // Final Summary
    console.log('\n🏥 FINAL RESULTS - HealthConnect Backend Functionality');
    console.log('====================================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.total}`);
    console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.passed === results.total) {
        console.log('\n🎉 🎉 🎉 100% FUNCTIONALITY ACHIEVED! 🎉 🎉 🎉');
        console.log('🚀 HealthConnect Backend is fully operational!');
        console.log('✅ All core features working perfectly');
        console.log('✅ Authentication system working');
        console.log('✅ AI Health Bot operational');
        console.log('✅ Appointment system functional');
        console.log('✅ User management complete');
        console.log('✅ Medical AI integration working');
    } else if (results.passed >= results.total * 0.9) {
        console.log('\n🎯 EXCELLENT! 90%+ functionality achieved!');
        console.log('🚀 HealthConnect Backend is nearly perfect!');
    } else if (results.passed >= results.total * 0.8) {
        console.log('\n✅ GREAT PROGRESS! 80%+ functionality achieved!');
        console.log('🔧 Minor issues remaining to fix');
    } else {
        console.log('\n⚠️ More work needed to achieve target functionality.');
    }
    
    // Detailed breakdown
    console.log('\n📋 Detailed Test Results:');
    results.details.forEach((detail, index) => {
        const status = detail.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return results;
}

test100PercentFunctionality().catch(console.error);
