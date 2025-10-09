# 🔧 Angular-Spring Boot Integration Testing Guide

## 🚀 **QUICK START - Testing the Fixed Integration**

### **Step 1: Start the Backend**
```bash
cd backend
.\mvnw.cmd spring-boot:run
```

### **Step 2: Start the Frontend**
```bash
cd frontend
npm start
```

### **Step 3: Test WebSocket Connection**
1. Open browser to `http://localhost:4200`
2. Login as a patient or doctor
3. Navigate to the Chat section
4. Look for the **WebSocket Status Indicator** at the top of the chat sidebar

---

## 🔍 **WHAT WAS FIXED**

### **Backend Improvements:**
1. ✅ **Enhanced WebSocket Authentication** - Added proper JWT token validation for WebSocket connections
2. ✅ **Improved Error Handling** - Better error messages and debugging information
3. ✅ **Heartbeat Configuration** - Added proper heartbeat settings for connection stability
4. ✅ **Channel Interceptor** - Added authentication interceptor for WebSocket messages

### **Frontend Improvements:**
1. ✅ **Enhanced Connection Management** - Better reconnection logic with exponential backoff
2. ✅ **Comprehensive Logging** - Detailed console logs for debugging connection issues
3. ✅ **Connection Status UI** - Visual indicator showing WebSocket connection status
4. ✅ **Error Recovery** - Automatic reconnection with user feedback

---

## 🧪 **TESTING SCENARIOS**

### **Scenario 1: Basic Connection Test**
1. **Expected**: Green status indicator showing "Real-time chat connected"
2. **If Red**: Check browser console for error messages
3. **If Yellow**: Connection is being established

### **Scenario 2: Authentication Test**
1. Login with valid credentials
2. Navigate to chat
3. **Expected**: WebSocket connects automatically after login
4. **Check**: Browser console should show "WebSocket authentication successful"

### **Scenario 3: Real-time Messaging Test**
1. Open two browser tabs/windows
2. Login as Patient in tab 1, Doctor in tab 2
3. Start a chat from patient to doctor
4. Send messages from both sides
5. **Expected**: Messages appear instantly in both tabs

### **Scenario 4: Reconnection Test**
1. Start with connected chat
2. Temporarily disable internet or restart backend
3. **Expected**: Status turns red, then automatically reconnects when service is restored
4. **Manual**: Click "Reconnect" button if needed

---

## 🐛 **TROUBLESHOOTING**

### **Connection Issues:**

#### **Problem**: WebSocket shows "Disconnected" status
**Solutions:**
1. Check if backend is running on port 8080
2. Verify JWT token is valid (check browser localStorage)
3. Check browser console for CORS errors
4. Restart both frontend and backend

#### **Problem**: Authentication Failed
**Solutions:**
1. Logout and login again to refresh JWT token
2. Check if token has expired
3. Verify user has proper role (PATIENT/DOCTOR)

#### **Problem**: Messages not appearing in real-time
**Solutions:**
1. Check WebSocket status indicator
2. Verify both users are in the same chat
3. Check browser console for subscription errors
4. Try manual reconnection

### **Backend Logs to Check:**
```bash
# Look for these log messages:
- "WebSocket CONNECT attempt with token: present"
- "WebSocket authentication successful for user: [username]"
- "Sending message from user [id] to chat [id]"
```

### **Frontend Console Logs to Check:**
```javascript
// Look for these console messages:
- "✅ WebSocket connected successfully"
- "Subscribing to chat messages for chat: [id]"
- "Received message: [message]"
- "Message published successfully"
```

---

## 📊 **CONNECTION STATUS MEANINGS**

| Status | Color | Meaning | Action |
|--------|-------|---------|--------|
| ✅ Connected | Green | Real-time chat working | None needed |
| ❌ Disconnected | Red | Connection lost | Check network/backend |
| 🔄 Connecting | Yellow | Establishing connection | Wait or check logs |

---

## 🔧 **ADVANCED DEBUGGING**

### **Enable Detailed WebSocket Logging:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for "STOMP Debug:" messages
4. Check Network tab for WebSocket connection

### **Backend Debug Mode:**
Add to `application.properties`:
```properties
logging.level.com.healthconnect.controller.WebSocketController=DEBUG
logging.level.com.healthconnect.config.WebSocketConfig=DEBUG
logging.level.org.springframework.web.socket=DEBUG
```

### **Test WebSocket Endpoint Directly:**
```javascript
// Test in browser console:
const socket = new SockJS('http://localhost:8080/api/ws');
const stompClient = Stomp.over(socket);
stompClient.connect({
  Authorization: 'Bearer YOUR_JWT_TOKEN'
}, function(frame) {
  console.log('Connected: ' + frame);
});
```

---

## ✅ **SUCCESS CRITERIA**

The integration is working correctly when:
1. ✅ WebSocket status shows green "Connected"
2. ✅ Messages appear instantly in both browser tabs
3. ✅ No errors in browser console
4. ✅ Backend logs show successful authentication
5. ✅ Automatic reconnection works after network issues

---

## 📞 **NEXT STEPS**

Once basic chat is working:
1. Test with multiple doctor-patient pairs
2. Test file attachments
3. Test message reactions and replies
4. Test typing indicators
5. Test presence indicators

---

## 🚨 **COMMON ISSUES & SOLUTIONS**

### **Issue**: CORS errors in browser console
**Solution**: Verify CORS configuration in SecurityConfig.java

### **Issue**: 403 Forbidden on WebSocket connection
**Solution**: Check JWT token validity and user authentication

### **Issue**: Messages sent but not received
**Solution**: Verify chat subscription and topic names match between frontend/backend

### **Issue**: Connection drops frequently
**Solution**: Check heartbeat settings and network stability
