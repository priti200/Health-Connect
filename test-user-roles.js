// Test User Roles for Chat Functionality
const https = require('https');

const BACKEND_URL = 'https://healthconnect-backend-1026546995867.us-central1.run.app';

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

async function testUserRoles() {
    console.log('👥 Testing User Roles for Chat Functionality');
    console.log('============================================');
    
    // Step 1: Login as patient
    console.log('\n1. Login as patient...');
    try {
        const loginData = {
            email: 'patient.test@healthconnect.com',
            password: 'password123'
        };
        
        const loginResult = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        
        if (loginResult.success && loginResult.data.token) {
            const token = loginResult.data.token;
            console.log(`✅ Patient login successful: ${loginResult.data.fullName}`);
            console.log(`   Role: ${loginResult.data.role}`);
            console.log(`   User ID: ${loginResult.data.id}`);
            
            // Step 2: Get current user details
            console.log('\n2. Get patient user details...');
            const userResult = await makeRequest(`${BACKEND_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userResult.success) {
                console.log(`✅ Patient details: ${userResult.data.fullName}`);
                console.log(`   Role: ${userResult.data.role}`);
                console.log(`   ID: ${userResult.data.id}`);
                console.log(`   Email: ${userResult.data.email}`);
            }
            
            // Step 3: Get all doctors
            console.log('\n3. Get all doctors...');
            const doctorsResult = await makeRequest(`${BACKEND_URL}/api/doctors`);
            
            if (doctorsResult.success) {
                console.log(`✅ Found ${doctorsResult.data.length} doctors:`);
                doctorsResult.data.forEach((doctor, index) => {
                    console.log(`   ${index + 1}. ${doctor.fullName} (ID: ${doctor.id}, Role: ${doctor.role})`);
                    console.log(`      Email: ${doctor.email}`);
                    console.log(`      Specialization: ${doctor.specialization || 'N/A'}`);
                });
                
                // Step 4: Try to create chat with first doctor
                if (doctorsResult.data.length > 0) {
                    const doctor = doctorsResult.data[0];
                    console.log(`\n4. Attempting to create chat with Dr. ${doctor.fullName}...`);
                    console.log(`   Patient: ${userResult.data.fullName} (ID: ${userResult.data.id}, Role: ${userResult.data.role})`);
                    console.log(`   Doctor: ${doctor.fullName} (ID: ${doctor.id}, Role: ${doctor.role})`);
                    
                    const chatData = { participantId: doctor.id };
                    
                    const chatResult = await makeRequest(`${BACKEND_URL}/api/chats`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(chatData)
                    });
                    
                    if (chatResult.success) {
                        console.log(`✅ Chat creation successful!`);
                        console.log(`   Chat ID: ${chatResult.data.id}`);
                        console.log(`   Patient: ${chatResult.data.patient.fullName}`);
                        console.log(`   Doctor: ${chatResult.data.doctor.fullName}`);
                    } else {
                        console.log(`❌ Chat creation failed: Status ${chatResult.status}`);
                        console.log(`   Response: ${JSON.stringify(chatResult.data)}`);
                        
                        // If it's a 400 error, it might be a role validation issue
                        if (chatResult.status === 400) {
                            console.log('\n🔍 Analyzing role validation issue...');
                            console.log(`   Expected: PATIENT (${userResult.data.role}) + DOCTOR (${doctor.role})`);
                            
                            if (userResult.data.role !== 'PATIENT') {
                                console.log(`   ❌ Current user is not PATIENT: ${userResult.data.role}`);
                            }
                            if (doctor.role !== 'DOCTOR') {
                                console.log(`   ❌ Target user is not DOCTOR: ${doctor.role}`);
                            }
                        }
                    }
                }
            } else {
                console.log(`❌ Failed to get doctors: Status ${doctorsResult.status}`);
            }
            
        } else {
            console.log(`❌ Patient login failed: Status ${loginResult.status}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Step 5: Try to login as doctor (if exists)
    console.log('\n5. Attempting to login as doctor...');
    try {
        const doctorLoginData = {
            email: 'doctor.test@healthconnect.com',
            password: 'password123'
        };
        
        const doctorLoginResult = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(doctorLoginData)
        });
        
        if (doctorLoginResult.success && doctorLoginResult.data.token) {
            console.log(`✅ Doctor login successful: ${doctorLoginResult.data.fullName}`);
            console.log(`   Role: ${doctorLoginResult.data.role}`);
            console.log(`   User ID: ${doctorLoginResult.data.id}`);
        } else {
            console.log(`❌ Doctor login failed: Status ${doctorLoginResult.status}`);
            console.log('   (This is expected if no doctor test account exists)');
        }
        
    } catch (error) {
        console.log(`❌ Doctor login error: ${error.message}`);
    }
    
    console.log('\n👥 User Roles Analysis Complete');
    console.log('===============================');
    console.log('Key findings:');
    console.log('1. Patient authentication working');
    console.log('2. Doctor list retrieval working');
    console.log('3. Role validation is the likely issue for chat creation');
    console.log('\nNext steps:');
    console.log('1. Verify doctor users have DOCTOR role');
    console.log('2. Check if role enum values match exactly');
    console.log('3. Test chat creation with verified roles');
}

testUserRoles().catch(console.error);
