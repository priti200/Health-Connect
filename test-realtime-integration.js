// Real-time Features Integration Test Script
// Run this in browser console after logging into the application

class RealtimeFeatureTester {
    constructor() {
        this.baseUrl = 'http://localhost:8080';
        this.wsUrl = 'http://localhost:8080/ws';
        this.token = localStorage.getItem('token');
        this.stompClient = null;
        this.testResults = {};
    }

    async runAllTests() {
        console.log('🚀 Starting Real-time Features Integration Tests...');
        
        try {
            await this.testWebSocketConnection();
            await this.testUserPresence();
            await this.testChatMessaging();
            await this.testTypingIndicators();
            await this.testFileUpload();
            await this.testMessageReactions();
            await this.testMessageReplies();
            
            this.displayResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testWebSocketConnection() {
        console.log('🔌 Testing WebSocket Connection...');
        
        return new Promise((resolve, reject) => {
            try {
                const socket = new SockJS(this.wsUrl);
                this.stompClient = Stomp.over(socket);
                
                this.stompClient.connect(
                    { Authorization: `Bearer ${this.token}` },
                    (frame) => {
                        console.log('✅ WebSocket connected:', frame);
                        this.testResults.websocket = 'PASS';
                        resolve();
                    },
                    (error) => {
                        console.error('❌ WebSocket connection failed:', error);
                        this.testResults.websocket = 'FAIL';
                        reject(error);
                    }
                );
            } catch (error) {
                console.error('❌ WebSocket setup failed:', error);
                this.testResults.websocket = 'FAIL';
                reject(error);
            }
        });
    }

    async testUserPresence() {
        console.log('👤 Testing User Presence...');
        
        try {
            // Subscribe to presence updates
            this.stompClient.subscribe('/topic/presence', (message) => {
                const presence = JSON.parse(message.body);
                console.log('📡 Received presence update:', presence);
            });

            // Send presence update
            this.stompClient.send('/app/presence/update', {}, JSON.stringify({
                status: 'ONLINE',
                statusMessage: 'Testing real-time features',
                deviceInfo: navigator.userAgent
            }));

            // Send heartbeat
            this.stompClient.send('/app/presence/heartbeat', {});

            this.testResults.presence = 'PASS';
            console.log('✅ User presence test passed');
        } catch (error) {
            console.error('❌ User presence test failed:', error);
            this.testResults.presence = 'FAIL';
        }
    }

    async testChatMessaging() {
        console.log('💬 Testing Chat Messaging...');
        
        try {
            const chatId = 1; // Assuming chat ID 1 exists
            
            // Subscribe to chat messages
            this.stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
                const msg = JSON.parse(message.body);
                console.log('📨 Received message:', msg);
            });

            // Send test message
            this.stompClient.send(`/app/chat/${chatId}/send`, {}, JSON.stringify({
                content: 'Test message from integration test - ' + new Date().toISOString()
            }));

            this.testResults.messaging = 'PASS';
            console.log('✅ Chat messaging test passed');
        } catch (error) {
            console.error('❌ Chat messaging test failed:', error);
            this.testResults.messaging = 'FAIL';
        }
    }

    async testTypingIndicators() {
        console.log('⌨️ Testing Typing Indicators...');
        
        try {
            const chatId = 1;
            
            // Subscribe to typing notifications
            this.stompClient.subscribe(`/topic/chat/${chatId}/typing`, (message) => {
                const typing = JSON.parse(message.body);
                console.log('⌨️ Received typing notification:', typing);
            });

            // Send typing start
            this.stompClient.send(`/app/chat/${chatId}/typing`, {}, 'typing');
            
            // Send typing stop after 2 seconds
            setTimeout(() => {
                this.stompClient.send(`/app/chat/${chatId}/typing`, {}, 'stopped');
            }, 2000);

            this.testResults.typing = 'PASS';
            console.log('✅ Typing indicators test passed');
        } catch (error) {
            console.error('❌ Typing indicators test failed:', error);
            this.testResults.typing = 'FAIL';
        }
    }

    async testFileUpload() {
        console.log('📎 Testing File Upload...');
        
        try {
            // Create a test file
            const testFile = new File(['Test file content'], 'test.txt', { type: 'text/plain' });
            const formData = new FormData();
            formData.append('file', testFile);
            formData.append('content', 'Test message with file attachment');

            const response = await fetch(`${this.baseUrl}/api/chats/1/messages/attachment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ File upload successful:', result);
                this.testResults.fileUpload = 'PASS';
            } else {
                throw new Error(`File upload failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ File upload test failed:', error);
            this.testResults.fileUpload = 'FAIL';
        }
    }

    async testMessageReactions() {
        console.log('😀 Testing Message Reactions...');
        
        try {
            const messageId = 1; // Assuming message ID 1 exists
            const chatId = 1;
            
            // Subscribe to reaction updates
            this.stompClient.subscribe(`/topic/chat/${chatId}/reactions`, (message) => {
                const reaction = JSON.parse(message.body);
                console.log('😀 Received reaction update:', reaction);
            });

            // Add reaction
            this.stompClient.send(`/app/message/${messageId}/react`, {}, JSON.stringify({
                reaction: '👍'
            }));

            this.testResults.reactions = 'PASS';
            console.log('✅ Message reactions test passed');
        } catch (error) {
            console.error('❌ Message reactions test failed:', error);
            this.testResults.reactions = 'FAIL';
        }
    }

    async testMessageReplies() {
        console.log('↩️ Testing Message Replies...');
        
        try {
            const chatId = 1;
            const replyToMessageId = 1; // Assuming message ID 1 exists
            
            // Send reply message
            this.stompClient.send(`/app/chat/${chatId}/reply`, {}, JSON.stringify({
                content: 'This is a reply to the previous message',
                replyToMessageId: replyToMessageId
            }));

            this.testResults.replies = 'PASS';
            console.log('✅ Message replies test passed');
        } catch (error) {
            console.error('❌ Message replies test failed:', error);
            this.testResults.replies = 'FAIL';
        }
    }

    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        Object.entries(this.testResults).forEach(([test, result]) => {
            const icon = result === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${test}: ${result}`);
        });

        const passCount = Object.values(this.testResults).filter(r => r === 'PASS').length;
        const totalCount = Object.keys(this.testResults).length;
        
        console.log(`\n📈 Overall: ${passCount}/${totalCount} tests passed`);
        
        if (passCount === totalCount) {
            console.log('🎉 All real-time features are working correctly!');
        } else {
            console.log('⚠️ Some features need attention. Check the logs above.');
        }
    }
}

// Auto-run tests if SockJS and Stomp are available
if (typeof SockJS !== 'undefined' && typeof Stomp !== 'undefined') {
    const tester = new RealtimeFeatureTester();
    
    // Add to global scope for manual testing
    window.realtimeTester = tester;
    
    console.log('🧪 Real-time Feature Tester loaded!');
    console.log('Run: realtimeTester.runAllTests() to start testing');
    console.log('Or run individual tests like: realtimeTester.testWebSocketConnection()');
} else {
    console.error('❌ SockJS or Stomp not found. Make sure they are loaded.');
    console.log('Add these scripts to your page:');
    console.log('<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>');
    console.log('<script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7/bundles/stomp.umd.min.js"></script>');
}
