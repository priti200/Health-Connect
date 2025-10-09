// HealthConnect API Testing Script
const API_BASE_URL = 'https://healthconnect-backend-1026546995867.us-central1.run.app';
const GEMINI_API_URL = 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant';

let authToken = null;
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
    
    testResults.details.push({
        timestamp,
        type,
        message
    });
}

function updateTestCount(passed) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json().catch(() => response.text());
        return { response, data, success: response.ok };
    } catch (error) {
        return { error: error.message, success: false };
    }
}

// Test Functions
async function testHealthCheck() {
    log('Testing Health Check Endpoint...');
    const result = await makeRequest(`${API_BASE_URL}/api/health`);
    
    if (result.success) {
        log('Health check passed', 'success');
        updateTestCount(true);
        return true;
    } else {
        log(`Health check failed: ${result.error || result.data}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testGeminiMedicalAssistant() {
    log('Testing Gemini Medical Assistant API...');
    
    const testMessage = "What are the side effects of aspirin and when should I avoid taking it?";
    
    const result = await makeRequest(GEMINI_API_URL, {
        method: 'POST',
        body: JSON.stringify({ message: testMessage })
    });
    
    if (result.success && result.data.response) {
        log('Gemini Medical Assistant API working', 'success');
        log(`Response preview: ${result.data.response.substring(0, 100)}...`);
        updateTestCount(true);
        return true;
    } else {
        log(`Gemini API failed: ${result.error || 'No response'}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testUserRegistration() {
    log('Testing User Registration...');
    
    const userData = {
        fullName: 'Test Patient API',
        email: `test.api.${Date.now()}@healthconnect.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'PATIENT',
        phoneNumber: '+1234567890',
        address: '123 Test Street'
    };
    
    const result = await makeRequest(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (result.success && result.data.token) {
        authToken = result.data.token;
        log('User registration successful', 'success');
        log(`User ID: ${result.data.id}, Name: ${result.data.fullName}`);
        updateTestCount(true);
        return true;
    } else {
        log(`Registration failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testUserLogin() {
    log('Testing User Login...');
    
    const loginData = {
        email: 'patient.test@healthconnect.com',
        password: 'password123'
    };
    
    const result = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(loginData)
    });
    
    if (result.success && result.data.token) {
        authToken = result.data.token;
        log('User login successful', 'success');
        log(`Welcome: ${result.data.fullName} (${result.data.role})`);
        updateTestCount(true);
        return true;
    } else {
        log(`Login failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testGetCurrentUser() {
    if (!authToken) {
        log('Skipping current user test - no auth token', 'error');
        updateTestCount(false);
        return false;
    }
    
    log('Testing Get Current User...');
    
    const result = await makeRequest(`${API_BASE_URL}/api/users/me`);
    
    if (result.success) {
        log('Get current user successful', 'success');
        log(`User: ${result.data.fullName} (${result.data.email})`);
        updateTestCount(true);
        return true;
    } else {
        log(`Get current user failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testGetDoctors() {
    log('Testing Get Doctors List...');
    
    const result = await makeRequest(`${API_BASE_URL}/api/users/doctors`);
    
    if (result.success) {
        log('Get doctors successful', 'success');
        log(`Found ${result.data.length} doctors`);
        if (result.data.length > 0) {
            log(`Sample doctor: ${result.data[0].fullName} - ${result.data[0].specialization}`);
        }
        updateTestCount(true);
        return true;
    } else {
        log(`Get doctors failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testAIHealthBot() {
    if (!authToken) {
        log('Skipping AI Health Bot test - no auth token', 'error');
        updateTestCount(false);
        return false;
    }
    
    log('Testing AI Health Bot...');
    
    const chatData = {
        message: "I have been experiencing headaches and fatigue for the past few days. What could be causing this?",
        isNewConversation: true,
        conversationType: "GENERAL_HEALTH"
    };
    
    const result = await makeRequest(`${API_BASE_URL}/api/ai-health-bot/chat`, {
        method: 'POST',
        body: JSON.stringify(chatData)
    });
    
    if (result.success && result.data.aiResponse) {
        log('AI Health Bot working', 'success');
        log(`AI Response preview: ${result.data.aiResponse.substring(0, 100)}...`);
        updateTestCount(true);
        return true;
    } else {
        log(`AI Health Bot failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testCreateAppointment() {
    if (!authToken) {
        log('Skipping appointment test - no auth token', 'error');
        updateTestCount(false);
        return false;
    }
    
    log('Testing Create Appointment...');
    
    // First get a doctor ID
    const doctorsResult = await makeRequest(`${API_BASE_URL}/api/users/doctors`);
    if (!doctorsResult.success || doctorsResult.data.length === 0) {
        log('No doctors available for appointment test', 'error');
        updateTestCount(false);
        return false;
    }
    
    const doctorId = doctorsResult.data[0].id;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointmentData = {
        doctorId: doctorId,
        date: tomorrow.toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "10:30",
        type: "CONSULTATION",
        reasonForVisit: "API Test Appointment"
    };
    
    const result = await makeRequest(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    });
    
    if (result.success) {
        log('Create appointment successful', 'success');
        log(`Appointment ID: ${result.data.id} with Dr. ${result.data.doctor.fullName}`);
        updateTestCount(true);
        return true;
    } else {
        log(`Create appointment failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testGetAppointments() {
    if (!authToken) {
        log('Skipping appointments test - no auth token', 'error');
        updateTestCount(false);
        return false;
    }
    
    log('Testing Get Appointments...');
    
    const result = await makeRequest(`${API_BASE_URL}/api/appointments`);
    
    if (result.success) {
        log('Get appointments successful', 'success');
        log(`Found ${result.data.length} appointments`);
        updateTestCount(true);
        return true;
    } else {
        log(`Get appointments failed: ${result.error || result.data.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

async function testCORSHeaders() {
    log('Testing CORS Configuration...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://healthconnect-frontend-dwa76nbkfq-uc.a.run.app',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        };
        
        if (corsHeaders['Access-Control-Allow-Origin']) {
            log('CORS configuration working', 'success');
            log(`CORS headers: ${JSON.stringify(corsHeaders, null, 2)}`);
            updateTestCount(true);
            return true;
        } else {
            log('CORS configuration missing', 'error');
            updateTestCount(false);
            return false;
        }
    } catch (error) {
        log(`CORS test failed: ${error.message}`, 'error');
        updateTestCount(false);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🏥 HealthConnect API Testing Suite');
    console.log('=====================================');
    
    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'CORS Configuration', fn: testCORSHeaders },
        { name: 'Gemini Medical Assistant', fn: testGeminiMedicalAssistant },
        { name: 'User Registration', fn: testUserRegistration },
        { name: 'User Login', fn: testUserLogin },
        { name: 'Get Current User', fn: testGetCurrentUser },
        { name: 'Get Doctors', fn: testGetDoctors },
        { name: 'AI Health Bot', fn: testAIHealthBot },
        { name: 'Create Appointment', fn: testCreateAppointment },
        { name: 'Get Appointments', fn: testGetAppointments }
    ];
    
    for (const test of tests) {
        console.log(`\n--- Testing: ${test.name} ---`);
        await test.fn();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
    
    // Print summary
    console.log('\n🏥 HealthConnect API Test Results');
    console.log('==================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(detail => detail.type === 'error')
            .forEach(detail => console.log(`   - ${detail.message}`));
    }
    
    return testResults;
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testGeminiMedicalAssistant };
} else {
    // Browser environment - attach to window
    window.HealthConnectAPITest = { runAllTests, testGeminiMedicalAssistant };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    console.log('HealthConnect API Test Suite loaded. Run HealthConnectAPITest.runAllTests() to start testing.');
}
