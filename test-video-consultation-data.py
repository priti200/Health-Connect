#!/usr/bin/env python3
"""
Test script to create sample video consultation data
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:4200"

# Test credentials
DOCTOR_EMAIL = "doctor.test@healthconnect.com"
PATIENT_EMAIL = "patient.test@healthconnect.com"
PASSWORD = "password123"

class VideoConsultationDataCreator:
    def __init__(self):
        self.session = requests.Session()
        self.doctor_token = None
        self.patient_token = None
        self.doctor_user = None
        self.patient_user = None
        self.appointment_id = None
        self.consultation_id = None

    def login_user(self, email, password):
        """Login user and return token"""
        print(f"🔐 Logging in user: {email}")
        
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Login successful for {email}")
                # The user data is in the response itself, not in a 'user' field
                user_data = {
                    'id': result.get('id'),
                    'fullName': result.get('fullName'),
                    'email': result.get('email'),
                    'role': result.get('role')
                }
                return result.get('token'), user_data
            else:
                print(f"❌ Login failed for {email}: {response.status_code} - {response.text}")
                return None, None
        except Exception as e:
            print(f"❌ Login error for {email}: {e}")
            return None, None

    def create_appointment(self):
        """Create a test appointment"""
        print("📅 Creating test appointment...")
        
        # Calculate appointment date (tomorrow)
        appointment_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        appointment_time = "14:30:00"
        
        appointment_data = {
            "doctorId": self.doctor_user['id'],
            "date": appointment_date,
            "startTime": appointment_time,
            "endTime": "15:30:00",
            "type": "VIDEO_CALL",
            "reasonForVisit": "Video consultation test",
            "notes": "Test appointment for video consultation feature"
        }
        
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/api/appointments", 
                                       json=appointment_data, headers=headers)
            if response.status_code == 201:
                appointment = response.json()
                self.appointment_id = appointment['id']
                print(f"✅ Appointment created with ID: {self.appointment_id}")
                return appointment
            else:
                print(f"❌ Appointment creation failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Appointment creation error: {e}")
            return None

    def create_video_consultation(self):
        """Create a video consultation for the appointment"""
        print("🎥 Creating video consultation...")
        
        consultation_data = {
            "appointmentId": self.appointment_id,
            "type": "ROUTINE_CHECKUP"
        }
        
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        try:
            response = self.session.post(f"{BACKEND_URL}/api/video-consultation/create", 
                                       json=consultation_data, headers=headers)
            if response.status_code == 201:
                consultation = response.json()
                self.consultation_id = consultation['id']
                print(f"✅ Video consultation created with ID: {self.consultation_id}")
                print(f"   Room ID: {consultation['roomId']}")
                return consultation
            else:
                print(f"❌ Video consultation creation failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Video consultation creation error: {e}")
            return None

    def test_consultation_endpoints(self):
        """Test the consultation endpoints"""
        print("🧪 Testing consultation endpoints...")
        
        # Test user consultations endpoint
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/api/video-consultation/user/consultations", 
                                      headers=headers)
            if response.status_code == 200:
                consultations = response.json()
                print(f"✅ User consultations endpoint working: {len(consultations)} consultations found")
            else:
                print(f"❌ User consultations endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ User consultations endpoint error: {e}")

        # Test upcoming consultations endpoint
        try:
            response = self.session.get(f"{BACKEND_URL}/api/video-consultation/user/upcoming", 
                                      headers=headers)
            if response.status_code == 200:
                upcoming = response.json()
                print(f"✅ Upcoming consultations endpoint working: {len(upcoming)} upcoming consultations")
            else:
                print(f"❌ Upcoming consultations endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Upcoming consultations endpoint error: {e}")

    def run_setup(self):
        """Run the complete setup"""
        print("🎯 VIDEO CONSULTATION DATA SETUP")
        print("=" * 50)
        
        # Login users
        self.doctor_token, self.doctor_user = self.login_user(DOCTOR_EMAIL, PASSWORD)
        if not self.doctor_token:
            print("❌ Doctor login failed!")
            return False
            
        self.patient_token, self.patient_user = self.login_user(PATIENT_EMAIL, PASSWORD)
        if not self.patient_token:
            print("❌ Patient login failed!")
            return False

        # Create appointment
        appointment = self.create_appointment()
        if not appointment:
            print("❌ Appointment creation failed!")
            return False

        # Create video consultation
        consultation = self.create_video_consultation()
        if not consultation:
            print("❌ Video consultation creation failed!")
            return False

        # Test endpoints
        self.test_consultation_endpoints()

        print("\n🎉 SUCCESS! Test data created successfully!")
        print(f"📍 Frontend URL: {FRONTEND_URL}")
        print(f"📍 Login as patient: {PATIENT_EMAIL} / {PASSWORD}")
        print(f"📍 Login as doctor: {DOCTOR_EMAIL} / {PASSWORD}")
        print("\n🎯 Now you can test the video consultation feature in the frontend!")
        
        return True

if __name__ == "__main__":
    creator = VideoConsultationDataCreator()
    creator.run_setup()
