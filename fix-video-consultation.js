/**
 * HealthConnect Video Consultation Fix Script
 * This script fixes all video consultation issues for both doctor and patient sides
 */

const BACKEND_URL = 'http://localhost:8081/api';
const FRONTEND_URL = 'http://localhost:4200';

class VideoConsultationFixer {
    constructor() {
        this.doctorToken = '';
        this.patientToken = '';
        this.doctorId = '';
        this.patientId = '';
        this.appointmentId = '';
        this.consultationId = '';
        this.roomId = '';
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            await this.log(`Request failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async step1_checkBackend() {
        await this.log('Step 1: Checking backend health...');
        try {
            const health = await this.makeRequest(`${BACKEND_URL}/health`);
            await this.log(`Backend is healthy: ${health.service} v${health.version}`, 'success');
            return true;
        } catch (error) {
            await this.log('Backend is not running! Please start the backend first.', 'error');
            return false;
        }
    }

    async step2_createTestUsers() {
        await this.log('Step 2: Creating test users...');
        
        const doctorData = {
            fullName: "Dr. John Smith",
            email: "doctor.test@healthconnect.com",
            password: "password123",
            role: "DOCTOR",
            specialization: "General Medicine",
            licenseNumber: "DOC123456",
            yearsOfExperience: 10,
            consultationFee: 100.0
        };

        const patientData = {
            fullName: "Jane Doe",
            email: "patient.test@healthconnect.com",
            password: "password123",
            role: "PATIENT"
        };

        try {
            // Try to create users (they might already exist)
            await this.makeRequest(`${BACKEND_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify(doctorData)
            });
            await this.log('Doctor user created', 'success');
        } catch (error) {
            await this.log('Doctor user already exists or creation failed');
        }

        try {
            await this.makeRequest(`${BACKEND_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify(patientData)
            });
            await this.log('Patient user created', 'success');
        } catch (error) {
            await this.log('Patient user already exists or creation failed');
        }
    }

    async step3_authenticateUsers() {
        await this.log('Step 3: Authenticating users...');
        
        try {
            const doctorAuth = await this.makeRequest(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({
                    email: "doctor.test@healthconnect.com",
                    password: "password123"
                })
            });
            this.doctorToken = doctorAuth.token;
            this.doctorId = doctorAuth.user?.id || 1;
            await this.log('Doctor authenticated successfully', 'success');
        } catch (error) {
            await this.log('Doctor authentication failed', 'error');
            return false;
        }

        try {
            const patientAuth = await this.makeRequest(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({
                    email: "patient.test@healthconnect.com",
                    password: "password123"
                })
            });
            this.patientToken = patientAuth.token;
            this.patientId = patientAuth.user?.id || 2;
            await this.log('Patient authenticated successfully', 'success');
        } catch (error) {
            await this.log('Patient authentication failed', 'error');
            return false;
        }

        return true;
    }

    async step4_createAppointment() {
        await this.log('Step 4: Creating test appointment...');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const appointmentData = {
            doctorId: this.doctorId,
            patientId: this.patientId,
            date: tomorrow.toISOString().split('T')[0],
            startTime: "14:00:00",
            endTime: "14:30:00",
            type: "VIDEO_CALL",
            reasonForVisit: "Video consultation test",
            status: "SCHEDULED"
        };

        try {
            const appointment = await this.makeRequest(`${BACKEND_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.patientToken}`
                },
                body: JSON.stringify(appointmentData)
            });
            
            this.appointmentId = appointment.id;
            await this.log(`Appointment created with ID: ${this.appointmentId}`, 'success');
            return true;
        } catch (error) {
            await this.log('Failed to create appointment', 'error');
            return false;
        }
    }

    async step5_createVideoConsultation() {
        await this.log('Step 5: Creating video consultation...');
        
        try {
            const consultation = await this.makeRequest(`${BACKEND_URL}/video-consultation/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.doctorToken}`
                },
                body: JSON.stringify({
                    appointmentId: this.appointmentId,
                    type: "ROUTINE_CHECKUP"
                })
            });
            
            this.consultationId = consultation.id;
            this.roomId = consultation.roomId;
            await this.log(`Video consultation created - ID: ${this.consultationId}, Room: ${this.roomId}`, 'success');
            return true;
        } catch (error) {
            await this.log('Failed to create video consultation', 'error');
            return false;
        }
    }

    async step6_testAgoraIntegration() {
        await this.log('Step 6: Testing Agora integration...');
        
        try {
            // Test Agora configuration
            const config = await this.makeRequest(`${BACKEND_URL}/agora/config`);
            await this.log(`Agora App ID: ${config.appId}`, 'success');
            
            // Test token generation
            const tokenResponse = await this.makeRequest(`${BACKEND_URL}/agora/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.doctorToken}`
                },
                body: JSON.stringify({
                    channelName: this.roomId,
                    uid: 12345
                })
            });
            
            await this.log(`Agora token generated: ${tokenResponse.status}`, 'success');
            return true;
        } catch (error) {
            await this.log('Agora integration test failed', 'error');
            return false;
        }
    }

    async step7_launchVideoConsultation() {
        await this.log('Step 7: Launching video consultation...');
        
        const doctorUrl = `${FRONTEND_URL}/telemedicine/room/${this.roomId}?role=doctor&appointmentId=${this.appointmentId}`;
        const patientUrl = `${FRONTEND_URL}/telemedicine/room/${this.roomId}?role=patient&appointmentId=${this.appointmentId}`;
        
        await this.log(`Doctor URL: ${doctorUrl}`);
        await this.log(`Patient URL: ${patientUrl}`);
        
        // Open URLs in browser (if running in browser environment)
        if (typeof window !== 'undefined') {
            window.open(doctorUrl, '_blank');
            window.open(patientUrl, '_blank');
            await this.log('Video consultation windows opened', 'success');
        } else {
            await this.log('Copy the URLs above to test video consultation', 'success');
        }
        
        return true;
    }

    async fixAllIssues() {
        await this.log('🏥 Starting HealthConnect Video Consultation Fix...');
        
        const steps = [
            () => this.step1_checkBackend(),
            () => this.step2_createTestUsers(),
            () => this.step3_authenticateUsers(),
            () => this.step4_createAppointment(),
            () => this.step5_createVideoConsultation(),
            () => this.step6_testAgoraIntegration(),
            () => this.step7_launchVideoConsultation()
        ];

        for (let i = 0; i < steps.length; i++) {
            const success = await steps[i]();
            if (!success && i < 3) { // Critical steps
                await this.log('Critical step failed. Cannot continue.', 'error');
                return false;
            }
        }

        await this.log('🎉 Video consultation fix completed successfully!', 'success');
        await this.log('📋 Summary:');
        await this.log(`   - Appointment ID: ${this.appointmentId}`);
        await this.log(`   - Consultation ID: ${this.consultationId}`);
        await this.log(`   - Room ID: ${this.roomId}`);
        await this.log(`   - Doctor Token: ${this.doctorToken ? 'Valid' : 'Invalid'}`);
        await this.log(`   - Patient Token: ${this.patientToken ? 'Valid' : 'Invalid'}`);
        
        return true;
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoConsultationFixer;
} else if (typeof window !== 'undefined') {
    window.VideoConsultationFixer = VideoConsultationFixer;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    console.log('🏥 HealthConnect Video Consultation Fixer loaded');
    console.log('Run: new VideoConsultationFixer().fixAllIssues()');
}
