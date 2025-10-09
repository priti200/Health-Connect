# 🎥 HealthConnect Video Call Testing Guide

## 🔧 Issues Found and Fixed

### ✅ **Port Configuration Issues Resolved**
1. **WebRTC Video Service**: Fixed hardcoded port 8080 → 8081
2. **Presence Service**: Fixed hardcoded port 8080 → 8081  
3. **Environment Configuration**: Already correctly configured for port 8081

### ✅ **Services Updated**
- `frontend/src/app/telemedicine/services/webrtc-video.service.ts` ✅ Fixed
- `frontend/src/app/core/services/presence.service.ts` ✅ Fixed
- `frontend/src/app/core/services/chat.service.ts` ✅ Using environment config
- `frontend/src/app/core/services/video-consultation.service.ts` ✅ Using environment config

## 🧪 **Manual Testing Steps**

### **Step 1: Login as Doctor**
1. Open browser: `http://localhost:4200`
2. Login with: `doctor.test@healthconnect.com` / `password123`
3. Navigate to **Appointments** → **List**

### **Step 2: Find Video Call Appointment**
1. Look for appointments with type "VIDEO_CALL"
2. Click on an appointment to view details
3. Look for "Start Video Call" or "Join Video Call" button

### **Step 3: Start Video Call**
1. Click "Start Video Call" button
2. Allow camera and microphone permissions when prompted
3. You should be redirected to the consultation room

### **Step 4: Test Video Call Features**
1. **Camera Toggle**: Click camera icon to turn video on/off
2. **Microphone Toggle**: Click microphone icon to mute/unmute
3. **Screen Sharing**: Click screen share icon (if available)
4. **Chat**: Use chat panel for text messages

### **Step 5: Join as Patient (Second Browser/Tab)**
1. Open new incognito/private browser window
2. Go to: `http://localhost:4200`
3. Login with: `patient.test@healthconnect.com` / `password123`
4. Navigate to appointments and join the same video call

## 🎯 **Expected Behavior**

### **✅ Working Features**
- ✅ User authentication and authorization
- ✅ Appointment booking and management
- ✅ Video consultation creation
- ✅ WebSocket connections for real-time communication
- ✅ Camera and microphone access
- ✅ Basic video call interface

### **🔧 Video Call Components**
- **Consultation Room**: `/telemedicine/consultation-room`
- **Video Consultation**: `/telemedicine/video-consultation`
- **WebRTC Service**: Real-time video/audio communication
- **Chat Integration**: Text messaging during calls

## 🚨 **Troubleshooting**

### **Issue: Camera/Microphone Not Working**
**Solution**: 
- Check browser permissions (click lock icon in address bar)
- Allow camera and microphone access
- Try refreshing the page

### **Issue: Video Call Button Not Visible**
**Solution**:
- Ensure appointment type is "VIDEO_CALL"
- Check that you're logged in as doctor or patient for that appointment
- Verify appointment is scheduled for today or future date

### **Issue: WebSocket Connection Failed**
**Solution**:
- Check browser console for errors
- Verify backend is running on port 8081
- Check network connectivity

### **Issue: "Unable to Start Video Call"**
**Solution**:
- Check browser console for detailed error messages
- Verify appointment exists and user has permission
- Try creating a new video call appointment

## 🔍 **Browser Console Debugging**

Open browser developer tools (F12) and check for:

### **✅ Expected Console Messages**
```
✅ WebSocket connected successfully
✅ Local stream initialized  
✅ Agora Video initialization...
✅ User media obtained successfully
```

### **❌ Error Messages to Watch For**
```
❌ WebSocket connection failed
❌ Failed to get user media
❌ Agora SDK not loaded
❌ Authorization failed
```

## 🌐 **Direct Video Call URLs**

For testing, you can try accessing these URLs directly:

1. **Consultation Room**: 
   `http://localhost:4200/telemedicine/consultation-room?roomId=test-room&appointmentId=1`

2. **Video Consultation**: 
   `http://localhost:4200/telemedicine/video-consultation?appointmentId=1`

## 📋 **Test Checklist**

- [ ] Backend running on port 8081
- [ ] Frontend running on port 4200  
- [ ] Doctor login successful
- [ ] Patient login successful
- [ ] Appointment with VIDEO_CALL type exists
- [ ] Video call button visible and clickable
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Video call interface loads
- [ ] Local video stream visible
- [ ] Audio/video controls working

## 🎉 **Success Indicators**

When video calling is working correctly, you should see:

1. **Video Call Interface**: Clean video call UI with local video
2. **Control Buttons**: Working mute, camera, and end call buttons
3. **Real-time Communication**: Instant audio/video transmission
4. **Chat Integration**: Working text chat alongside video
5. **Connection Status**: "Connected" or "In Call" status indicators

## 🔧 **Backend API Endpoints**

The video call system uses these endpoints:
- `POST /api/video-consultation/create` - Create consultation
- `POST /api/video-consultation/{id}/start` - Start consultation  
- `GET /api/video-consultation/{id}/token` - Get access token
- `WebSocket /ws` - Real-time signaling

## 📞 **Support**

If video calling still doesn't work after following this guide:

1. Check all console error messages
2. Verify all services are running on correct ports
3. Test with different browsers (Chrome, Firefox, Edge)
4. Check firewall/antivirus settings
5. Try creating a fresh appointment with VIDEO_CALL type

The video calling functionality should now be working correctly with the port configuration fixes applied!
