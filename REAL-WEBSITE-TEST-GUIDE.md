# 🌐 REAL WEBSITE CHAT TEST GUIDE

## 🚀 **COMPLETE SETUP**

### **Step 1: Start Backend**
```bash
.\start-backend-fixed.bat
```
**Wait for**: `Started HealthConnectApplication in X.XXX seconds`

### **Step 2: Start Frontend**
```bash
cd frontend
npm start
```
**Wait for**: `Angular Live Development Server is listening on localhost:4200`

## 🧪 **REAL WEBSITE TESTING**

### **Test 1: Basic Login & Navigation**

1. **Open Browser**: Go to `http://localhost:4200`
2. **Login as Patient**: 
   - Email: `patient.test@healthconnect.com`
   - Password: `password123`
3. **Verify Dashboard**: Should see patient dashboard
4. **Check Navigation**: Verify all menu items work

### **Test 2: Appointment Booking**

1. **Navigate to Appointments**: Click "Book Appointment"
2. **Select Doctor**: Choose available doctor
3. **Book Appointment**: Complete booking process
4. **Verify Booking**: Should see appointment in list

### **Test 3: Chat Functionality**

1. **Access Chat**: From appointment or direct chat section
2. **Start Chat**: Click "Start Chat" or "Message Doctor"
3. **Send Message**: Type and send a test message
4. **Verify WebSocket**: Check browser console for connection logs

### **Test 4: Doctor Side Testing**

1. **Open New Browser/Incognito**: `http://localhost:4200`
2. **Login as Doctor**:
   - Email: `doctor.test@healthconnect.com`
   - Password: `password123`
3. **Check Appointments**: Should see patient's appointment
4. **Access Chat**: Respond to patient's message
5. **Real-time Test**: Send messages back and forth

## 🔍 **DEBUGGING REAL WEBSITE ISSUES**

### **Frontend Console Logs to Watch:**
```
✅ WebSocket connected successfully
✅ Chat created/retrieved successfully
✅ Message sent successfully
❌ WebSocket not connected
❌ Failed to send message
```

### **Backend Logs to Watch:**
```
✅ Started HealthConnectApplication
✅ Tomcat started on port(s): 8080
✅ WebSocket authentication successful
❌ WebSocket authentication failed
❌ Failed to send message
```

### **Network Tab Checks:**
- **WebSocket Connection**: Should see `ws://localhost:8080/api/ws`
- **API Calls**: Should see successful `/api/chats` calls
- **Authentication**: Should see `Authorization: Bearer` headers

## 🛠️ **COMMON REAL WEBSITE ISSUES**

### **Issue 1: Chat Button Not Working**
**Symptoms**: Click chat but nothing happens
**Check**: 
- Browser console for errors
- Network tab for failed API calls
- Backend logs for authentication errors

### **Issue 2: Messages Not Sending**
**Symptoms**: Type message but doesn't send
**Check**:
- WebSocket connection status
- Authentication token validity
- Backend WebSocket logs

### **Issue 3: Real-time Not Working**
**Symptoms**: Messages send but don't appear in real-time
**Check**:
- WebSocket subscription logs
- Message broadcasting in backend
- Frontend message subscription

### **Issue 4: Authentication Errors**
**Symptoms**: Logged out when accessing chat
**Check**:
- JWT token expiration
- Backend authentication logs
- Frontend token management

## 📊 **SUCCESS INDICATORS**

### **✅ Backend Working:**
- Health check returns 200: `http://localhost:8080/api/health`
- WebSocket health OK: `http://localhost:8080/api/health/websocket`
- H2 console accessible: `http://localhost:8080/h2-console`

### **✅ Frontend Working:**
- Login successful
- Dashboard loads
- Navigation works
- No console errors

### **✅ Chat Working:**
- WebSocket connects automatically after login
- Chat creation works
- Messages send and receive in real-time
- Both patient and doctor can communicate

## 🎯 **COMPLETE WORKFLOW TEST**

### **End-to-End Test Scenario:**

1. **Patient Journey**:
   - Login → Dashboard → Book Appointment → Start Chat → Send Message

2. **Doctor Journey**:
   - Login → View Appointments → Access Chat → Respond to Patient

3. **Real-time Verification**:
   - Both users see messages instantly
   - Typing indicators work
   - Connection status shows "Connected"

### **Expected Results:**
- ✅ No authentication errors
- ✅ WebSocket connects successfully
- ✅ Messages appear in real-time
- ✅ Both users can communicate seamlessly

## 🚨 **IF ISSUES PERSIST**

### **Quick Fixes:**
1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Restart Services**: Stop and restart both backend and frontend
3. **Check Ports**: Ensure 8080 and 4200 are not blocked
4. **Verify Tokens**: Check JWT token validity in browser storage

### **Advanced Debugging:**
1. **Backend Logs**: Check for WebSocket and authentication errors
2. **Frontend Console**: Look for connection and API errors
3. **Network Analysis**: Verify WebSocket handshake success
4. **Database Check**: Verify data in H2 console

**The real website chat functionality should now work end-to-end!**
