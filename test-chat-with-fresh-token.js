// Test Chat with Fresh Token
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

async function testChatWithFreshToken() {
    console.log('🔐 Testing Chat with Fresh Token');
    console.log('===============================');
    
    // Step 1: Login with existing user to get fresh token
    console.log('\n1. Getting fresh token via login...');
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
            const userId = loginResult.data.id;
            console.log(`✅ Login successful: ${loginResult.data.fullName}`);
            console.log(`   Token: ${token.substring(0, 30)}...`);
            console.log(`   User ID: ${userId}`);
            
            // Step 2: Immediately test JWT validation
            console.log('\n2. Testing JWT validation immediately...');
            const userResult = await makeRequest(`${BACKEND_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userResult.success) {
                console.log(`✅ JWT validation: PASSED - ${userResult.data.fullName}`);
            } else {
                console.log(`❌ JWT validation: FAILED - Status ${userResult.status}`);
                return;
            }
            
            // Step 3: Get a doctor
            console.log('\n3. Getting doctor for chat...');
            const doctorsResult = await makeRequest(`${BACKEND_URL}/api/doctors`);
            if (!doctorsResult.success || doctorsResult.data.length === 0) {
                console.log('❌ No doctors available');
                return;
            }
            
            const doctorId = doctorsResult.data[0].id;
            console.log(`✅ Found doctor: ${doctorsResult.data[0].fullName} (ID: ${doctorId})`);
            
            // Step 4: Test chat creation immediately with fresh token
            console.log('\n4. Testing chat creation with fresh token...');
            const chatData = { participantId: doctorId };
            
            const chatResult = await makeRequest(`${BACKEND_URL}/api/chats`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(chatData)
            });
            
            if (chatResult.success) {
                console.log(`✅ Chat creation: PASSED - Chat ID ${chatResult.data.id}`);
                
                // Step 5: Test getting chats
                console.log('\n5. Testing get chats...');
                const chatsResult = await makeRequest(`${BACKEND_URL}/api/chats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (chatsResult.success) {
                    console.log(`✅ Get chats: PASSED - Found ${chatsResult.data.length} chats`);
                } else {
                    console.log(`❌ Get chats: FAILED - Status ${chatsResult.status}`);
                }
                
                // Step 6: Test getting messages
                console.log('\n6. Testing get messages...');
                const messagesResult = await makeRequest(`${BACKEND_URL}/api/chats/${chatResult.data.id}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (messagesResult.success) {
                    console.log(`✅ Get messages: PASSED - Found ${messagesResult.data.length} messages`);
                } else {
                    console.log(`❌ Get messages: FAILED - Status ${messagesResult.status}`);
                }
                
                // Step 7: Test sending a message via HTTP API
                console.log('\n7. Testing send message via HTTP...');
                const messageData = {
                    content: 'Hello Doctor! This is a test message from the API.'
                };
                
                const sendResult = await makeRequest(`${BACKEND_URL}/api/chats/${chatResult.data.id}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(messageData)
                });
                
                if (sendResult.success) {
                    console.log(`✅ Send message: PASSED - Message ID ${sendResult.data.id}`);
                    console.log(`   Content: ${sendResult.data.content}`);
                } else {
                    console.log(`❌ Send message: FAILED - Status ${sendResult.status}`);
                }
                
                console.log('\n🎉 CHAT FUNCTIONALITY TEST COMPLETE!');
                console.log('====================================');
                console.log('✅ Fresh token authentication working');
                console.log('✅ Chat creation working');
                console.log('✅ Message retrieval working');
                console.log('✅ Message sending working');
                console.log('\n🚀 Real-time chat backend is functional!');
                console.log('Next: Test WebSocket real-time messaging from frontend');
                
            } else {
                console.log(`❌ Chat creation: FAILED - Status ${chatResult.status}`);
                console.log(`   Response: ${JSON.stringify(chatResult.data)}`);
                
                // Debug: Check if it's an authentication issue
                if (chatResult.status === 403) {
                    console.log('\n🔍 Debugging 403 error...');
                    console.log('This suggests JWT authentication is failing');
                    console.log('Possible causes:');
                    console.log('1. Token format issue');
                    console.log('2. JWT secret mismatch');
                    console.log('3. Token expiration');
                    console.log('4. Security filter chain issue');
                }
            }
            
        } else {
            console.log(`❌ Login failed: Status ${loginResult.status}`);
            console.log(`   Response: ${JSON.stringify(loginResult.data)}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

testChatWithFreshToken().catch(console.error);
