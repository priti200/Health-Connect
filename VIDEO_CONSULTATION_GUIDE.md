# Video Consultation Feature - Complete Guide

## Overview

The HealthConnect Video Consultation feature provides real-time video calling capabilities for doctor-patient consultations using WebRTC technology. This feature includes video/audio calling, screen sharing, chat, and call recording capabilities.

## Features Implemented

### ✅ Core Features
- **Real-time Video Calling**: WebRTC-powered video calls between doctors and patients
- **Audio Controls**: Mute/unmute microphone during calls
- **Video Controls**: Enable/disable camera during calls
- **Screen Sharing**: Share screen for medical records or educational content
- **In-call Chat**: Text messaging during video consultations
- **Call Recording**: Record consultations with patient consent
- **Connection Status**: Real-time connection quality indicators
- **Presence Management**: User status updates during calls

### ✅ Integration Features
- **Appointment Integration**: Create video consultations from existing appointments
- **Navigation Integration**: Access video consultations from main navigation
- **Notification System**: Real-time notifications for consultation events
- **Role-based Access**: Different permissions for doctors vs patients
- **Authentication**: Secure access with JWT tokens

### ✅ Backend Infrastructure
- **Video Consultation Service**: Complete CRUD operations for consultations
- **WebRTC Signaling**: WebSocket-based signaling for peer connections
- **Database Models**: Comprehensive data models for consultations
- **REST API**: Full REST API for consultation management
- **Security**: Role-based authorization and data validation

## Architecture

### Frontend (Angular 16)
```
src/app/telemedicine/
├── consultation-room/          # Main video call interface
├── video-consultation/         # Consultation details and controls
├── consultation-list/          # List of user's consultations
└── telemedicine-routing.module.ts
```

### Backend (Spring Boot)
```
backend/src/main/java/com/healthconnect/
├── controller/VideoConsultationController.java
├── service/VideoConsultationService.java
├── service/WebRTCService.java
├── entity/VideoConsultation.java
└── repository/VideoConsultationRepository.java
```

### Key Services
- **VideoConsultationService**: Manages consultation lifecycle
- **WebRTCService**: Handles peer connections and signaling
- **NotificationService**: Real-time notifications
- **PresenceService**: User status management

## How to Use

### For Patients

1. **Book Video Appointment**
   - Go to Appointments → Book Appointment
   - Select a doctor and choose "Video Call" type
   - Pick date and time

2. **Start Video Consultation**
   - Go to appointment details
   - Click "Start Video Consultation" (available 15 minutes before appointment)
   - Allow camera and microphone permissions

3. **During the Call**
   - Use video/audio controls at bottom of screen
   - Open chat panel for text messages
   - Wait for doctor to join

### For Doctors

1. **View Scheduled Consultations**
   - Navigate to "Video Consultations" in main menu
   - See list of upcoming consultations

2. **Start Consultation**
   - Click "Start Consultation" on scheduled consultation
   - System creates video room and sends notifications

3. **Manage Consultation**
   - Control video/audio settings
   - Share screen for medical records
   - Use chat for additional communication
   - End consultation with notes and recommendations

## API Endpoints

### Video Consultation Management
```
POST   /api/video-consultation/create           # Create consultation
POST   /api/video-consultation/{id}/start       # Start consultation
POST   /api/video-consultation/{id}/end         # End consultation
GET    /api/video-consultation/{id}             # Get consultation details
GET    /api/video-consultation/appointment/{id} # Get by appointment ID
GET    /api/video-consultation/room/{roomId}    # Get by room ID
```

### WebRTC Signaling
```
WebSocket: /app/webrtc/{roomId}/join            # Join room
WebSocket: /app/webrtc/{roomId}/signal          # Send WebRTC signals
WebSocket: /app/webrtc/{roomId}/leave           # Leave room
```

## Frontend Routes

```
/telemedicine/consultations                     # List consultations
/telemedicine/consultation/{id}                 # Consultation details
/telemedicine/room/{roomId}                     # Video call room
```

## Testing

### Automated Testing
Run the comprehensive test script:
```bash
python test-video-consultation.py
```

This tests:
- User registration
- Appointment creation
- Video consultation creation
- WebRTC endpoints
- Consultation lifecycle

### Manual Testing

1. **Start Backend**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Workflow**
   - Register as doctor and patient (different browsers/tabs)
   - Create video appointment as patient
   - Start consultation as doctor
   - Join as patient
   - Test video/audio controls
   - Test screen sharing
   - Test chat functionality
   - End consultation

## Configuration

### WebRTC Configuration
The WebRTC service uses STUN servers for NAT traversal:
```typescript
private configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

### Environment Variables
```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

## Security Considerations

- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Role-based access control (doctors vs patients)
- **Data Validation**: Input validation on all API endpoints
- **WebRTC Security**: Peer-to-peer encryption for video streams
- **Recording Consent**: Explicit consent required for call recording

## Troubleshooting

### Common Issues

1. **Camera/Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify device availability

2. **Connection Failed**
   - Check WebSocket connection
   - Verify STUN server accessibility
   - Check firewall settings

3. **No Video/Audio**
   - Verify WebRTC peer connection
   - Check ICE candidate exchange
   - Ensure proper signaling

### Debug Tools

1. **Browser Console**: Check for WebRTC errors
2. **Network Tab**: Monitor WebSocket connections
3. **Backend Logs**: Check Spring Boot console
4. **Test Script**: Run automated tests

## Future Enhancements

### Planned Features
- **Multi-party Calls**: Support for multiple participants
- **Call Quality Metrics**: Real-time quality monitoring
- **Mobile App Support**: React Native implementation
- **Advanced Recording**: Cloud storage integration
- **AI Integration**: Real-time transcription and analysis

### Technical Improvements
- **TURN Server**: Better NAT traversal
- **Load Balancing**: Multiple WebRTC servers
- **CDN Integration**: Global content delivery
- **Advanced Analytics**: Call quality metrics

## Support

For technical support or feature requests:
1. Check this documentation
2. Run the test script for diagnostics
3. Check browser console for errors
4. Review backend logs for server issues

## Conclusion

The Video Consultation feature provides a complete telemedicine solution with real-time video calling, integrated chat, screen sharing, and comprehensive consultation management. The system is designed for scalability, security, and ease of use for both healthcare providers and patients.
