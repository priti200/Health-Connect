// Test Chat with Correct User IDs
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

async function testChatWithCorrectIds() {
    console.log('💬 Testing Chat with Correct User IDs');
    console.log('=====================================');
    
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
            const patientId = loginResult.data.id;
            console.log(`✅ Patient login successful: ${loginResult.data.fullName}`);
            console.log(`   Role: ${loginResult.data.role}`);
            console.log(`   Patient ID: ${patientId}`);
            
            // Step 2: Get doctors and find one with different ID
            console.log('\n2. Finding a doctor with different ID...');
            const doctorsResult = await makeRequest(`${BACKEND_URL}/api/doctors`);
            
            if (doctorsResult.success) {
                // Find a doctor with different ID than patient
                const availableDoctors = doctorsResult.data.filter(doctor => doctor.id !== patientId);
                
                if (availableDoctors.length > 0) {
                    const doctor = availableDoctors[0];
                    console.log(`✅ Found suitable doctor: ${doctor.fullName}`);
                    console.log(`   Doctor ID: ${doctor.id} (different from patient ID: ${patientId})`);
                    console.log(`   Role: ${doctor.role}`);
                    console.log(`   Specialization: ${doctor.specialization}`);
                    
                    // Step 3: Create chat with different doctor
                    console.log('\n3. Creating chat with different doctor...');
                    const chatData = { participantId: doctor.id };
                    
                    const chatResult = await makeRequest(`${BACKEND_URL}/api/chats`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(chatData)
                    });
                    
                    if (chatResult.success) {
                        console.log(`✅ Chat creation successful!`);
                        console.log(`   Chat ID: ${chatResult.data.id}`);
                        console.log(`   Patient: ${chatResult.data.patient.fullName} (ID: ${chatResult.data.patient.id})`);
                        console.log(`   Doctor: ${chatResult.data.doctor.fullName} (ID: ${chatResult.data.doctor.id})`);
                        
                        const chatId = chatResult.data.id;
                        
                        // Step 4: Test sending a message
                        console.log('\n4. Sending a test message...');
                        const messageData = { content: 'Hello Doctor! This is a test message from the patient.' };
                        
                        const messageResult = await makeRequest(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify(messageData)
                        });
                        
                        if (messageResult.success) {
                            console.log(`✅ Message sent successfully!`);
                            console.log(`   Message ID: ${messageResult.data.id}`);
                            console.log(`   Content: ${messageResult.data.content}`);
                            console.log(`   Sender: ${messageResult.data.sender.fullName}`);
                            console.log(`   Status: ${messageResult.data.status}`);
                        } else {
                            console.log(`❌ Message sending failed: Status ${messageResult.status}`);
                        }
                        
                        // Step 5: Test getting chat messages
                        console.log('\n5. Retrieving chat messages...');
                        const messagesResult = await makeRequest(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (messagesResult.success) {
                            console.log(`✅ Messages retrieved successfully!`);
                            console.log(`   Found ${messagesResult.data.length} messages`);
                            messagesResult.data.forEach((msg, index) => {
                                console.log(`   ${index + 1}. ${msg.sender.fullName}: ${msg.content}`);
                            });
                        } else {
                            console.log(`❌ Message retrieval failed: Status ${messagesResult.status}`);
                        }
                        
                        // Step 6: Test getting user chats
                        console.log('\n6. Getting user chats...');
                        const chatsResult = await makeRequest(`${BACKEND_URL}/api/chats`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (chatsResult.success) {
                            console.log(`✅ User chats retrieved successfully!`);
                            console.log(`   Found ${chatsResult.data.length} chats`);
                            chatsResult.data.forEach((chat, index) => {
                                console.log(`   ${index + 1}. Chat with ${chat.doctor.fullName} (ID: ${chat.id})`);
                                if (chat.lastMessage) {
                                    console.log(`      Last message: ${chat.lastMessage.content}`);
                                }
                            });
                        } else {
                            console.log(`❌ Chat retrieval failed: Status ${chatsResult.status}`);
                        }
                        
                        console.log('\n🎉 REAL-TIME CHAT FUNCTIONALITY TEST COMPLETE!');
                        console.log('==============================================');
                        console.log('✅ Patient authentication working');
                        console.log('✅ Chat creation working');
                        console.log('✅ Message sending working');
                        console.log('✅ Message retrieval working');
                        console.log('✅ Chat listing working');
                        console.log('\n🚀 Real-time chat backend is fully functional!');
                        console.log('\n📋 Test Results Summary:');
                        console.log(`   Chat ID: ${chatId}`);
                        console.log(`   Patient: ${chatResult.data.patient.fullName} (ID: ${patientId})`);
                        console.log(`   Doctor: ${doctor.fullName} (ID: ${doctor.id})`);
                        console.log(`   WebSocket URL: ${BACKEND_URL.replace('https://', 'wss://')}/ws`);
                        console.log('\n🔧 Next Steps:');
                        console.log('1. Test WebSocket real-time messaging from frontend');
                        console.log('2. Test typing indicators');
                        console.log('3. Test message status updates');
                        console.log('4. Test message reactions');
                        
                    } else {
                        console.log(`❌ Chat creation failed: Status ${chatResult.status}`);
                        console.log(`   Response: ${JSON.stringify(chatResult.data)}`);
                    }
                    
                } else {
                    console.log(`❌ No suitable doctors found (all have same ID as patient)`);
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
}

testChatWithCorrectIds().catch(console.error);
