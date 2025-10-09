#!/usr/bin/env python3
"""
Debug script to identify and test Phase 2 critical issues:
1. Appointment booking conflicts
2. Doctor dashboard integration
3. Doctor discovery/registration integration
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:4200"

class HealthConnectDebugger:
    def __init__(self):
        self.session = requests.Session()
        self.doctor_token = None
        self.patient_token = None
        self.doctor_id = None
        self.patient_id = None
        
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
            "fullName": "Dr. Test Doctor",
            "email": f"testdoctor{int(time.time())}@test.com",
            "password": "password123",
            "confirmPassword": "password123",
            "role": "DOCTOR",
            "specialization": "Cardiology",
            "licenseNumber": f"LIC{int(time.time())}",
            "affiliation": "Test Hospital",
            "yearsOfExperience": 10,
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
            "fullName": "Test Patient",
            "email": f"testpatient{int(time.time())}@test.com",
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
    
    def test_doctor_discovery(self):
        """Test Issue 3: Doctor Discovery/Registration Integration"""
        print("\n🔍 Testing Doctor Discovery...")
        
        # Test getting all doctors
        response = self.session.get(f"{BACKEND_URL}/api/doctors")
        if response.status_code == 200:
            doctors = response.json()
            print(f"✅ Found {len(doctors)} doctors in system")
            
            # Check if our test doctor is in the list
            test_doctor_found = any(d['id'] == self.doctor_id for d in doctors)
            if test_doctor_found:
                print("✅ Test doctor appears in doctor list")
            else:
                print("❌ Test doctor NOT found in doctor list")
                return False
                
            # Test specialization filter
            cardiology_response = self.session.get(f"{BACKEND_URL}/api/doctors?specialization=Cardiology")
            if cardiology_response.status_code == 200:
                cardiology_doctors = cardiology_response.json()
                print(f"✅ Found {len(cardiology_doctors)} Cardiology doctors")
                
                test_doctor_in_specialization = any(d['id'] == self.doctor_id for d in cardiology_doctors)
                if test_doctor_in_specialization:
                    print("✅ Test doctor appears in specialization filter")
                else:
                    print("❌ Test doctor NOT found in specialization filter")
                    return False
            else:
                print(f"❌ Specialization filter failed: {cardiology_response.text}")
                return False
                
        else:
            print(f"❌ Doctor discovery failed: {response.text}")
            return False
            
        return True
    
    def test_appointment_booking_conflicts(self):
        """Test Issue 1: Appointment Booking Conflicts"""
        print("\n📅 Testing Appointment Booking Conflicts...")
        
        # Set patient authorization
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        
        # Get tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # First appointment booking
        appointment1_data = {
            "doctorId": self.doctor_id,
            "date": tomorrow,
            "startTime": "10:00",
            "endTime": "10:30",
            "type": "IN_PERSON",
            "reasonForVisit": "First appointment test"
        }
        
        response1 = self.session.post(f"{BACKEND_URL}/api/appointments", 
                                     json=appointment1_data, headers=headers)
        
        if response1.status_code == 201:
            appointment1 = response1.json()
            print(f"✅ First appointment booked: ID {appointment1['id']}")
            
            # Try to book second appointment at different time
            appointment2_data = {
                "doctorId": self.doctor_id,
                "date": tomorrow,
                "startTime": "11:00",
                "endTime": "11:30",
                "type": "VIDEO_CALL",
                "reasonForVisit": "Second appointment test"
            }
            
            response2 = self.session.post(f"{BACKEND_URL}/api/appointments", 
                                         json=appointment2_data, headers=headers)
            
            if response2.status_code == 201:
                appointment2 = response2.json()
                print(f"✅ Second appointment booked: ID {appointment2['id']}")
                
                # Try to book conflicting appointment
                conflict_data = {
                    "doctorId": self.doctor_id,
                    "date": tomorrow,
                    "startTime": "10:15",
                    "endTime": "10:45",
                    "type": "IN_PERSON",
                    "reasonForVisit": "Conflicting appointment test"
                }
                
                response3 = self.session.post(f"{BACKEND_URL}/api/appointments", 
                                             json=conflict_data, headers=headers)
                
                if response3.status_code == 400:
                    print("✅ Conflicting appointment correctly rejected")
                else:
                    print(f"❌ Conflicting appointment was allowed: {response3.status_code}")
                    return False
                    
                return True
            else:
                print(f"❌ Second appointment booking failed: {response2.text}")
                return False
        else:
            print(f"❌ First appointment booking failed: {response1.text}")
            return False
    
    def test_doctor_dashboard_integration(self):
        """Test Issue 2: Doctor Dashboard Integration"""
        print("\n👨‍⚕️ Testing Doctor Dashboard Integration...")
        
        # Set doctor authorization
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        # Get doctor's appointments
        response = self.session.get(f"{BACKEND_URL}/api/appointments", headers=headers)
        
        if response.status_code == 200:
            appointments = response.json()
            print(f"✅ Doctor can access appointments: {len(appointments)} found")
            
            # Check if appointments show patient information
            for apt in appointments:
                if 'patient' in apt and 'fullName' in apt['patient']:
                    print(f"✅ Appointment {apt['id']} shows patient: {apt['patient']['fullName']}")
                else:
                    print(f"❌ Appointment {apt['id']} missing patient information")
                    return False
            
            # Test today's appointments
            today_response = self.session.get(f"{BACKEND_URL}/api/appointments/today", headers=headers)
            if today_response.status_code == 200:
                today_appointments = today_response.json()
                print(f"✅ Today's appointments endpoint works: {len(today_appointments)} found")
            else:
                print(f"❌ Today's appointments failed: {today_response.text}")
                return False
                
            return True
        else:
            print(f"❌ Doctor appointments access failed: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all debug tests"""
        print("🏥 HEALTHCONNECT PHASE 2 DEBUG TESTS")
        print("=" * 50)
        
        if not self.test_backend_health():
            print("❌ Backend is not running!")
            return False
        
        print("✅ Backend is running")
        
        if not self.register_test_users():
            print("❌ Failed to register test users")
            return False
        
        # Test all issues
        issue1_result = self.test_appointment_booking_conflicts()
        issue2_result = self.test_doctor_dashboard_integration()
        issue3_result = self.test_doctor_discovery()
        
        print("\n" + "=" * 50)
        print("🏥 DEBUG TEST SUMMARY")
        print("=" * 50)
        print(f"Issue 1 - Appointment Booking Conflicts: {'✅ PASS' if issue1_result else '❌ FAIL'}")
        print(f"Issue 2 - Doctor Dashboard Integration: {'✅ PASS' if issue2_result else '❌ FAIL'}")
        print(f"Issue 3 - Doctor Discovery Integration: {'✅ PASS' if issue3_result else '❌ FAIL'}")
        
        all_passed = issue1_result and issue2_result and issue3_result
        print(f"\nOverall Result: {'🎉 ALL TESTS PASSED' if all_passed else '🚨 ISSUES FOUND'}")
        
        return all_passed

if __name__ == "__main__":
    debugger = HealthConnectDebugger()
    debugger.run_all_tests()
