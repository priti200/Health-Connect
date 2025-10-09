# 🏥 HealthConnect - Complete Chat System Testing Guide

## 🚀 **QUICK START**

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

### **Step 3: Test Chat Functionality**
Open the test file: `test-chat-complete-workflow.html` in your browser.

---

## 🔧 **WHAT WAS FIXED**

### **Backend Improvements:**
1. ✅ **Global Exception Handler** - Added comprehensive error handling
2. ✅ **WebSocket Authentication** - Improved security and error handling
3. ✅ **Chat Controller** - Added input validation and better error responses
4. ✅ **WebSocket Controller** - Enhanced message validation and error handling

### **Frontend Improvements:**
1. ✅ **Chat Service** - Added Promise-based messaging with proper error handling
2. ✅ **Connection Management** - Improved WebSocket connection with auto-reconnection
3. ✅ **Token Validation** - Added token expiration checks
4. ✅ **Error Handling** - Better user feedback for errors

---

## 📋 **TESTING WORKFLOW**

### **Option 1: Use the Test HTML File**
1. Open `test-chat-complete-workflow.html` in your browser
2. Follow the step-by-step testing process:
   - **Authentication**: Login as patient or doctor
   - **WebSocket**: Auto-connects after login
   - **Chat Creation**: Create chat between users
   - **Messaging**: Send real-time messages

### **Option 2: Use the Angular Application**
1. Go to `http://localhost:4200`
2. Login as Patient: `patient.test@healthconnect.com` / `password123`
3. Book an appointment with a doctor
4. Start a chat from the appointment
5. Open another browser/incognito window
6. Login as Doctor: `doctor.test@healthconnect.com` / `password123`
7. Check appointments and respond to chat

---

## 🧪 **TEST SCENARIOS**

### **Scenario 1: Patient-Doctor Chat**
1. **Patient** books appointment with doctor
2. **Patient** starts chat from appointment
3. **Doctor** receives chat notification
4. **Both** exchange messages in real-time

### **Scenario 2: Error Handling**
1. Try sending empty messages (should be blocked)
2. Disconnect WebSocket and try sending (should show error)
3. Use expired token (should redirect to login)
4. Try creating chat with invalid participant (should show error)

### **Scenario 3: Connection Recovery**
1. Start chat conversation
2. Disconnect internet/WebSocket
3. Reconnect - should auto-reconnect
4. Continue conversation

---

## 🔍 **DEBUGGING**

### **Backend Logs to Watch:**
- WebSocket connection success/failure
- Authentication errors
- Message sending/receiving
- Chat creation logs

### **Frontend Console to Check:**
- WebSocket connection status
- Authentication token validity
- Message sending errors
- Connection recovery attempts

### **Common Issues & Solutions:**

#### **Issue: WebSocket 403 Forbidden**
- **Cause**: WebSocket message broker was disabled
- **Solution**: ✅ Fixed - `@EnableWebSocketMessageBroker` enabled

#### **Issue: User logged out when accessing chat**
- **Cause**: Authentication errors in WebSocket interceptor
- **Solution**: ✅ Fixed - Improved error handling and validation

#### **Issue: Messages not sending**
- **Cause**: Missing validation and error handling
- **Solution**: ✅ Fixed - Added comprehensive validation

#### **Issue: Connection drops frequently**
- **Cause**: No reconnection logic
- **Solution**: ✅ Fixed - Added auto-reconnection with token validation

---

## 📊 **EXPECTED TEST RESULTS**

### **✅ All Tests Should Pass:**
1. **Authentication**: ✅ PASS
2. **WebSocket Connection**: ✅ PASS  
3. **Chat Creation**: ✅ PASS
4. **Real-time Messaging**: ✅ PASS

### **🎯 Success Indicators:**
- Green status indicators in test page
- Messages appear in real-time
- No console errors
- Smooth user experience

---

## 🚨 **TROUBLESHOOTING**

### **If Backend Won't Start:**
```bash
# Check Java version
java -version

# Set JAVA_HOME if needed
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Try alternative startup
cd backend
.\run-simple.bat
```

### **If Frontend Won't Start:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### **If WebSocket Won't Connect:**
1. Check backend is running on port 8080
2. Verify user is logged in with valid token
3. Check browser console for errors
4. Try refreshing the page

---

## 🎉 **NEXT STEPS**

After confirming chat functionality works:

1. **Test with multiple users** - Open multiple browser windows
2. **Test appointment-based chats** - Create chats from appointments
3. **Test error scenarios** - Verify error handling works
4. **Performance testing** - Send multiple messages rapidly
5. **Mobile testing** - Test on mobile devices

The chat system is now fully functional with proper error handling, authentication, and real-time messaging capabilities!
