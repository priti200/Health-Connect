# Video Calling End-to-End Test Plan

## Overview
This document outlines comprehensive test scenarios for the HealthConnect video calling functionality using Agora SDK integration.

## Test Environment Setup

### Prerequisites
1. **Backend**: Spring Boot application running on port 8081 with:
   - AgoraTokenController providing token endpoints
   - AgoraTokenService with proper Agora SDK integration
   - Valid Agora App ID and Certificate configured

2. **Frontend**: Angular application running on port 4200 with:
   - AgoraVideoService properly configured
   - ConsultationRoomComponent integrated
   - Agora RTC SDK installed and imported

3. **Browser Requirements**:
   - Chrome/Firefox/Safari with camera and microphone permissions
   - HTTPS or localhost for WebRTC functionality
   - No ad blockers or privacy extensions blocking media access

## Test Scenarios

### 1. Basic Video Call Flow

#### Test Case 1.1: Successful Video Call Initiation
**Objective**: Verify that a doctor can successfully start a video consultation

**Steps**:
1. Login as a doctor
2. Navigate to scheduled consultations
3. Click "Start Video Call" for a scheduled appointment
4. Verify consultation room loads with room ID
5. Grant camera and microphone permissions when prompted
6. Verify local video stream appears
7. Verify connection status shows "Connected"

**Expected Results**:
- Local video stream displays in the designated area
- Audio/video controls are visible and functional
- Connection status indicates successful connection
- No error messages displayed

#### Test Case 1.2: Patient Joining Video Call
**Objective**: Verify that a patient can join an ongoing video consultation

**Steps**:
1. Login as a patient
2. Navigate to the consultation room using the provided room ID
3. Grant camera and microphone permissions
4. Verify local video stream appears
5. Verify remote video stream (doctor) appears
6. Test audio communication

**Expected Results**:
- Both local and remote video streams are visible
- Audio communication works bidirectionally
- Video quality is acceptable
- No connection errors

### 2. Video/Audio Controls Testing

#### Test Case 2.1: Video Toggle Functionality
**Steps**:
1. Join a video call successfully
2. Click the "Turn Off Video" button
3. Verify local video stream stops
4. Verify remote participant sees video is disabled
5. Click "Turn On Video" button
6. Verify local video stream resumes

**Expected Results**:
- Video toggles on/off correctly
- UI button states update appropriately
- Remote participant receives proper notifications

#### Test Case 2.2: Audio Toggle Functionality
**Steps**:
1. Join a video call successfully
2. Click the "Mute Audio" button
3. Verify microphone is muted
4. Verify remote participant cannot hear audio
5. Click "Unmute Audio" button
6. Verify audio communication resumes

**Expected Results**:
- Audio mutes/unmutes correctly
- Mute status is clearly indicated in UI
- Remote participant receives proper audio state updates

### 3. Error Handling and Edge Cases

#### Test Case 3.1: Network Disconnection
**Steps**:
1. Start a video call successfully
2. Disconnect network connection
3. Verify error handling and reconnection attempts
4. Reconnect network
5. Verify call resumes or proper error message

**Expected Results**:
- Clear error message about connection loss
- Automatic reconnection attempts
- Graceful degradation of service

#### Test Case 3.2: Camera/Microphone Permission Denied
**Steps**:
1. Navigate to consultation room
2. Deny camera and microphone permissions
3. Verify appropriate error message
4. Provide instructions for enabling permissions

**Expected Results**:
- Clear error message about permissions
- Instructions for enabling camera/microphone access
- Option to retry after granting permissions

#### Test Case 3.3: Backend Service Unavailable
**Steps**:
1. Stop the Spring Boot backend
2. Attempt to join a video call
3. Verify fallback to demo mode
4. Verify basic video calling still works

**Expected Results**:
- Graceful fallback to Agora demo mode
- Video calling functionality still available
- Clear indication of demo mode usage

### 4. Multi-User Scenarios

#### Test Case 4.1: Multiple Participants
**Steps**:
1. Doctor starts video consultation
2. Patient joins the consultation
3. Verify both participants can see and hear each other
4. Test simultaneous audio/video controls
5. Verify call quality with multiple streams

**Expected Results**:
- Stable connection with multiple participants
- Good audio/video quality
- Responsive controls for all participants

### 5. Performance and Quality Testing

#### Test Case 5.1: Call Duration and Stability
**Steps**:
1. Start a video call
2. Maintain call for 30+ minutes
3. Monitor connection stability
4. Test controls periodically during call
5. Verify call quality remains consistent

**Expected Results**:
- Stable connection throughout extended call
- Consistent audio/video quality
- No memory leaks or performance degradation

#### Test Case 5.2: Different Network Conditions
**Steps**:
1. Test video calling on high-speed connection
2. Test on slower/limited bandwidth connection
3. Verify adaptive quality based on network
4. Test during network congestion

**Expected Results**:
- Adaptive video quality based on bandwidth
- Maintained audio quality even with poor video
- Graceful handling of network limitations

### 6. Browser Compatibility

#### Test Case 6.1: Cross-Browser Testing
**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Steps**:
1. Test basic video calling functionality in each browser
2. Verify audio/video controls work correctly
3. Test cross-browser communication (Chrome to Firefox, etc.)

**Expected Results**:
- Consistent functionality across all supported browsers
- Cross-browser video calls work seamlessly

### 7. Security and Privacy

#### Test Case 7.1: Token Authentication
**Steps**:
1. Verify Agora tokens are properly generated by backend
2. Test token expiration handling
3. Verify unauthorized access is prevented

**Expected Results**:
- Valid tokens allow access to video channels
- Expired tokens are handled gracefully
- Unauthorized users cannot join calls

## Test Data Requirements

### Sample Users
- **Doctor**: doctor.test@healthconnect.com / password123
- **Patient**: patient.test@healthconnect.com / password123

### Sample Consultation Data
- Room ID: test-room-123
- Scheduled consultation between doctor and patient
- Valid appointment with VIDEO type

## Success Criteria

### Functional Requirements
- ✅ Video calls can be initiated and joined successfully
- ✅ Audio/video controls work reliably
- ✅ Multiple participants can communicate effectively
- ✅ Error conditions are handled gracefully

### Performance Requirements
- ✅ Video call connects within 10 seconds
- ✅ Audio latency < 200ms
- ✅ Video quality adapts to network conditions
- ✅ Stable calls for 60+ minutes

### Compatibility Requirements
- ✅ Works on Chrome, Firefox, Safari, Edge
- ✅ Mobile browser compatibility (iOS Safari, Chrome Mobile)
- ✅ Cross-platform communication

## Known Issues and Limitations

1. **Backend Dependency**: Full token authentication requires Spring Boot backend
2. **HTTPS Requirement**: WebRTC requires HTTPS in production
3. **Firewall Considerations**: Corporate firewalls may block WebRTC traffic
4. **Mobile Limitations**: Some mobile browsers have WebRTC limitations

## Automated Test Execution

### Unit Tests
```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

### Integration Tests
```bash
cd frontend
ng e2e
```

### Manual Test Checklist
- [ ] Basic video call flow (doctor → patient)
- [ ] Audio/video controls functionality
- [ ] Error handling scenarios
- [ ] Cross-browser compatibility
- [ ] Network condition variations
- [ ] Extended call duration testing
