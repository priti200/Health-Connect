#!/usr/bin/env python3
"""
Comprehensive test script for Video Consultation feature
Tests the complete workflow from appointment creation to video call
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:4200"

class VideoConsultationTester:
    def __init__(self):
        self.session = requests.Session()
        self.doctor_token = None
        self.patient_token = None
        self.doctor_id = None
        self.patient_id = None
        self.appointment_id = None
        self.consultation_id = None
        
    def test_backend_health(self):
        """Test if backend is running"""
        try:
            response = self.session.get(f"{BACKEND_URL}/api/test/health")
            return response.status_code == 200
        except:
            return False
    
    def register_test_users(self):
        """Register test doctor and patient"""
        print("🔄 Registering test users...")
        
        # Register doctor
        doctor_data = {
            "fullName": "Dr. Video Test",
            "email": f"videodoctor{int(time.time())}@test.com",
            "password": "password123",
            "confirmPassword": "password123",
            "role": "DOCTOR",
            "specialization": "Telemedicine",
            "licenseNumber": f"VID{int(time.time())}",
            "affiliation": "Video Test Hospital",
            "yearsOfExperience": 5,
            "phoneNumber": "1234567890",
            "address": "Test Address"
        }
        
        doctor_response = self.session.post(f"{BACKEND_URL}/api/auth/register", json=doctor_data)
        if doctor_response.status_code == 200:
            doctor_result = doctor_response.json()
            self.doctor_token = doctor_result['token']
            self.doctor_id = doctor_result['id']
            print(f"✅ Doctor registered: ID {self.doctor_id}")
        else:
            print(f"❌ Doctor registration failed: {doctor_response.text}")
            return False
        
        # Register patient
        patient_data = {
            "fullName": "Video Test Patient",
            "email": f"videopatient{int(time.time())}@test.com",
            "password": "password123",
            "confirmPassword": "password123",
            "role": "PATIENT",
            "phoneNumber": "0987654321",
            "address": "Patient Address"
        }
        
        patient_response = self.session.post(f"{BACKEND_URL}/api/auth/register", json=patient_data)
        if patient_response.status_code == 200:
            patient_result = patient_response.json()
            self.patient_token = patient_result['token']
            self.patient_id = patient_result['id']
            print(f"✅ Patient registered: ID {self.patient_id}")
            return True
        else:
            print(f"❌ Patient registration failed: {patient_response.text}")
            return False
    
    def create_video_appointment(self):
        """Create a video call appointment"""
        print("\n📅 Creating video appointment...")
        
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        
        # Get tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        appointment_data = {
            "doctorId": self.doctor_id,
            "date": tomorrow,
            "startTime": "14:00",
            "endTime": "14:30",
            "type": "VIDEO_CALL",
            "reasonForVisit": "Video consultation test"
        }
        
        response = self.session.post(f"{BACKEND_URL}/api/appointments", 
                                   json=appointment_data, headers=headers)
        
        if response.status_code == 201:
            appointment = response.json()
            self.appointment_id = appointment['id']
            print(f"✅ Video appointment created: ID {self.appointment_id}")
            return True
        else:
            print(f"❌ Video appointment creation failed: {response.text}")
            return False
    
    def test_video_consultation_creation(self):
        """Test creating video consultation from appointment"""
        print("\n🎥 Testing video consultation creation...")
        
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        consultation_data = {
            "appointmentId": self.appointment_id,
            "type": "ROUTINE_CHECKUP"
        }
        
        response = self.session.post(f"{BACKEND_URL}/api/video-consultation/create", 
                                   json=consultation_data, headers=headers)
        
        if response.status_code == 201:
            consultation = response.json()
            self.consultation_id = consultation['id']
            print(f"✅ Video consultation created: ID {self.consultation_id}")
            print(f"   Room ID: {consultation['roomId']}")
            print(f"   Status: {consultation['status']}")
            return True
        else:
            print(f"❌ Video consultation creation failed: {response.text}")
            return False
    
    def test_consultation_by_appointment_lookup(self):
        """Test getting consultation by appointment ID"""
        print("\n🔍 Testing consultation lookup by appointment...")
        
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        
        response = self.session.get(f"{BACKEND_URL}/api/video-consultation/appointment/{self.appointment_id}", 
                                  headers=headers)
        
        if response.status_code == 200:
            consultation = response.json()
            print(f"✅ Consultation found by appointment ID: {consultation['id']}")
            return True
        else:
            print(f"❌ Consultation lookup failed: {response.text}")
            return False
    
    def test_consultation_start(self):
        """Test starting the consultation"""
        print("\n▶️ Testing consultation start...")
        
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        response = self.session.post(f"{BACKEND_URL}/api/video-consultation/{self.consultation_id}/start", 
                                   headers=headers)
        
        if response.status_code == 200:
            consultation = response.json()
            print(f"✅ Consultation started: Status {consultation['status']}")
            return True
        else:
            print(f"❌ Consultation start failed: {response.text}")
            return False
    
    def test_webrtc_endpoints(self):
        """Test WebRTC related endpoints"""
        print("\n🌐 Testing WebRTC endpoints...")
        
        # Test WebRTC health
        try:
            response = self.session.get(f"{BACKEND_URL}/api/video-consultation/health")
            if response.status_code == 200:
                print("✅ WebRTC service health check passed")
                return True
            else:
                print(f"❌ WebRTC health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ WebRTC health check error: {e}")
            return False
    
    def test_consultation_end(self):
        """Test ending the consultation"""
        print("\n⏹️ Testing consultation end...")
        
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        end_data = {
            "notes": "Test consultation completed successfully",
            "diagnosis": "Test diagnosis",
            "recommendations": "Test recommendations"
        }
        
        response = self.session.post(f"{BACKEND_URL}/api/video-consultation/{self.consultation_id}/end", 
                                   json=end_data, headers=headers)
        
        if response.status_code == 200:
            consultation = response.json()
            print(f"✅ Consultation ended: Status {consultation['status']}")
            return True
        else:
            print(f"❌ Consultation end failed: {response.text}")
            return False
    
    def test_frontend_navigation(self):
        """Test frontend navigation to video consultation"""
        print("\n🖥️ Testing frontend navigation...")
        
        try:
            # Test if frontend is accessible
            response = self.session.get(FRONTEND_URL)
            if response.status_code == 200:
                print("✅ Frontend is accessible")
                
                # Test telemedicine route
                telemedicine_url = f"{FRONTEND_URL}/telemedicine"
                print(f"📍 Telemedicine URL: {telemedicine_url}")
                print("   (Open this URL in browser to test video consultation UI)")
                return True
            else:
                print(f"❌ Frontend not accessible: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend test error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all video consultation tests"""
        print("🎥 VIDEO CONSULTATION FEATURE TESTS")
        print("=" * 50)
        
        if not self.test_backend_health():
            print("❌ Backend is not running!")
            return False
        
        print("✅ Backend is running")
        
        # Test sequence
        tests = [
            ("User Registration", self.register_test_users),
            ("Video Appointment Creation", self.create_video_appointment),
            ("Video Consultation Creation", self.test_video_consultation_creation),
            ("Consultation Lookup", self.test_consultation_by_appointment_lookup),
            ("Consultation Start", self.test_consultation_start),
            ("WebRTC Endpoints", self.test_webrtc_endpoints),
            ("Consultation End", self.test_consultation_end),
            ("Frontend Navigation", self.test_frontend_navigation)
        ]
        
        results = {}
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} failed with error: {e}")
                results[test_name] = False
        
        # Summary
        print("\n" + "=" * 50)
        print("🎥 VIDEO CONSULTATION TEST SUMMARY")
        print("=" * 50)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name}: {status}")
        
        all_passed = all(results.values())
        print(f"\nOverall Result: {'🎉 ALL TESTS PASSED' if all_passed else '🚨 SOME TESTS FAILED'}")
        
        if all_passed:
            print("\n🎯 NEXT STEPS:")
            print("1. Open frontend in browser")
            print("2. Login as doctor or patient")
            print("3. Navigate to Video Consultations")
            print("4. Test real-time video calling")
            print("5. Test screen sharing and chat features")
        
        return all_passed

if __name__ == "__main__":
    tester = VideoConsultationTester()
    tester.run_all_tests()
