# 🎥 Video Calling Testing Checklist

## 📋 Pre-Test Setup

### ✅ Environment Check
- [ ] Backend running on port 8080
- [ ] Frontend running on port 4200
- [ ] Chrome/Firefox browser (latest version)
- [ ] Camera and microphone available
- [ ] Network connection stable

### ✅ Service Health Check
```bash
# Run this script to verify backend
./test-video-backend.bat
```

**Expected Results:**
- [ ] Backend Health: ✅ OK
- [ ] WebSocket: ✅ OK
- [ ] Video Consultation API: ✅ Ready
- [ ] WebRTC Signaling: ✅ Ready

## 🧪 Test Execution

### Phase 1: User Setup
- [ ] **Patient Registration/Login**: `patient.test@healthconnect.com` / `password123`
- [ ] **Doctor Registration/Login**: `doctor.test@healthconnect.com` / `password123`
- [ ] Both users can access dashboard

### Phase 2: Appointment Booking
- [ ] **Patient books VIDEO_CALL appointment**
- [ ] **Doctor sees appointment in dashboard**
- [ ] **Doctor confirms appointment**
- [ ] **Appointment status = "CONFIRMED"**

### Phase 3: Video Consultation Creation
- [ ] **Patient clicks "Start Video Consultation"**
- [ ] **Redirects to `/telemedicine/consultation/{id}`**
- [ ] **Consultation details page loads**
- [ ] **"Join Consultation" button appears**

### Phase 4: WebRTC Connection
- [ ] **Patient clicks "Join Consultation"**
- [ ] **Browser requests camera/microphone permissions**
- [ ] **Patient grants permissions**
- [ ] **Redirects to `/telemedicine/room/{roomId}`**
- [ ] **Local video appears (patient)**

### Phase 5: Doctor Joins
- [ ] **Doctor goes to Telemedicine → Consultations**
- [ ] **Doctor finds active consultation**
- [ ] **Doctor clicks "Start Consultation"**
- [ ] **Doctor grants camera/microphone permissions**
- [ ] **Doctor enters consultation room**
- [ ] **Local video appears (doctor)**

### Phase 6: Peer-to-Peer Connection
- [ ] **Patient sees doctor's video (remote stream)**
- [ ] **Doctor sees patient's video (remote stream)**
- [ ] **Audio is working both ways**
- [ ] **Video quality is acceptable**
- [ ] **No connection errors in console**

### Phase 7: Feature Testing
- [ ] **Video Toggle**: Both users can turn video on/off
- [ ] **Audio Toggle**: Both users can mute/unmute
- [ ] **Screen Sharing**: Works from both sides
- [ ] **Chat Messages**: Real-time messaging during call
- [ ] **Connection Status**: Shows connected/disconnected states

### Phase 8: Call Management
- [ ] **Call Duration**: Timer shows elapsed time
- [ ] **End Call**: Doctor can end consultation
- [ ] **Cleanup**: Resources released properly
- [ ] **Post-call**: Consultation marked as completed

## 🐛 Troubleshooting

### Common Issues & Solutions

**❌ Backend Not Starting**
```bash
# Check Java version
java -version
# Should be Java 21 or 23

# Try different startup script
cd backend
./start-backend-now.bat
```

**❌ WebSocket Connection Failed**
- Check browser console for WebSocket errors
- Verify CORS settings in backend
- Ensure port 8080 is not blocked

**❌ Camera/Microphone Access Denied**
- Check browser permissions
- Try different browser
- Ensure HTTPS or localhost

**❌ No Remote Video**
- Check WebRTC signaling in console
- Verify both users joined same room
- Check network connectivity

**❌ Video Consultation Button Missing**
- Verify appointment type is "VIDEO_CALL"
- Check appointment status is "CONFIRMED"
- Ensure user has proper permissions

## 📊 Success Criteria

### ✅ Minimum Viable Test
- [ ] Two users can join video call
- [ ] Both can see and hear each other
- [ ] Basic controls work (mute/video toggle)
- [ ] Call can be ended properly

### ✅ Full Feature Test
- [ ] All above + screen sharing
- [ ] Real-time chat during call
- [ ] Connection quality indicators
- [ ] Proper error handling
- [ ] Clean resource cleanup

## 🎯 Next Steps After Testing

1. **If tests pass**: Video calling is fully functional ✅
2. **If tests fail**: Document specific issues for debugging
3. **Performance testing**: Test with multiple concurrent calls
4. **Production readiness**: Add monitoring and logging
