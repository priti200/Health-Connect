# Video Consultation Testing Guide

## Current Status
- ✅ Backend: Spring Boot with WebSocket + WebRTC support
- ✅ Frontend: Angular 16 with video consultation components
- ✅ WebRTC Service: Implemented with signaling
- ✅ Video Consultation Service: Full CRUD operations
- ✅ Consultation Room Component: Complete UI with controls
- ✅ Routing: Telemedicine module properly configured
- ✅ Database: H2 with video consultation entities
- ✅ Authentication: JWT-based with role support

## Prerequisites
1. **Backend**: Must be running on port 8080
2. **Frontend**: Must be running on port 4200
3. **Browser**: Chrome/Firefox with camera/microphone permissions
4. **Network**: Local network or HTTPS for WebRTC
5. **Test Users**: Doctor and Patient accounts

## Test Steps

### Step 1: Start Backend and Frontend
```bash
# Terminal 1: Start Backend
cd backend
./start-backend-now.bat  # Windows
# OR
./start-backend.sh       # Linux/Mac

# Terminal 2: Start Frontend
cd frontend
npm start
```

### Step 2: Verify Services
1. Backend Health: http://localhost:8080/api/health
2. WebSocket Health: http://localhost:8080/api/health/websocket
3. Frontend: http://localhost:4200
4. H2 Console: http://localhost:8080/h2-console

### Step 3: Create Test Users (if needed)
1. Register as Doctor: `doctor.test@healthconnect.com` / `password123`
2. Register as Patient: `patient.test@healthconnect.com` / `password123`

### Step 4: Book Video Appointment
1. Login as **Patient**: `patient.test@healthconnect.com` / `password123`
2. Navigate to **Appointments** → **Book New Appointment**
3. Select a doctor from the list
4. **CRITICAL**: Select **"Video Call"** as appointment type
5. Choose today's date and a time slot
6. Add reason: "Video consultation test"
7. Submit appointment

### Step 5: Confirm Appointment (Doctor)
1. Open **new browser tab/window**
2. Login as **Doctor**: `doctor.test@healthconnect.com` / `password123`
3. Navigate to **Appointments** → **My Appointments**
4. Find the video appointment from patient
5. Click **"View Details"**
6. Change status to **"Confirmed"**
7. Save changes

### Step 6: Start Video Consultation (Patient)
1. **Switch back to Patient tab**
2. Refresh the appointment details page
3. Verify appointment status is "Confirmed"
4. Click **"Start Video Consultation"** button
5. **Allow camera/microphone permissions** when prompted
6. Should redirect to `/telemedicine/consultation/{id}`
7. Then click **"Join Consultation"** to enter room

### Step 7: Join Video Consultation (Doctor)
1. **Switch to Doctor tab**
2. Go to **Telemedicine** → **Consultations**
3. Find the active consultation
4. Click **"Start Consultation"** (doctor can start)
5. Should redirect to `/telemedicine/room/{roomId}`
6. **Allow camera/microphone permissions** when prompted

### Step 8: Test Video Call Features
**In both browser tabs (Patient + Doctor):**
1. ✅ **Camera Access**: Verify local video appears
2. ✅ **Audio Access**: Check microphone indicator
3. ✅ **Video Controls**: Toggle video on/off
4. ✅ **Audio Controls**: Toggle mute/unmute
5. ✅ **Screen Sharing**: Test screen share button
6. ✅ **Chat**: Send messages during call
7. ✅ **Connection**: Verify WebRTC peer connection
8. ✅ **Remote Video**: Should see other participant

### Step 9: Test Real-time Features
1. **Message Exchange**: Send chat messages between tabs
2. **Video Toggle**: Turn video on/off and verify in other tab
3. **Audio Toggle**: Mute/unmute and check indicators
4. **Screen Share**: Share screen and verify in other tab
5. **Connection Status**: Monitor connection quality indicators

## Potential Issues to Check

### Issue 1: Appointment Type Not Set to VIDEO_CALL
- Make sure when booking appointment, "Video Call" is selected
- Check appointment details show type as "VIDEO_CALL"

### Issue 2: Browser Permissions
- Camera/microphone permissions must be granted
- HTTPS may be required for WebRTC (localhost should work)

### Issue 3: WebSocket Connection
- Check browser console for WebSocket connection errors
- Verify backend WebSocket endpoints are working

### Issue 4: Backend API Endpoints
- Video consultation creation endpoint: POST /api/video-consultation/create
- Start consultation endpoint: POST /api/video-consultation/{id}/start
- WebRTC signaling: /app/webrtc/{roomId}/signal

## Debug Commands

### Check Backend Logs
Look for these in backend console:
- "Creating video consultation for appointment: {id}"
- "User {id} joined room: {roomId}"
- WebRTC signaling messages

### Check Frontend Console
Look for these in browser console:
- WebRTC initialization messages
- Media device access requests
- WebSocket connection status
- Any error messages

## Quick Test URLs
- Telemedicine List: http://localhost:4200/telemedicine/consultations
- Debug Page: http://localhost:4200/debug
