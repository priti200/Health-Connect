#!/usr/bin/env python3
"""
Phase 2 Integration Test - Appointment Management System
Tests doctor discovery, appointment booking, and management features
"""

import requests
import json
import sys
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8080/api"
FRONTEND_URL = "http://localhost:4200"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🏥 {title}")
    print(f"{'='*60}")

def print_test(test_name, status="RUNNING"):
    if status == "PASS":
        print(f"✅ PASS {test_name}")
    elif status == "FAIL":
        print(f"❌ FAIL {test_name}")
    else:
        print(f"🔄 {test_name}...")

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/test/health", timeout=5)
        if response.status_code == 200:
            print_test("Backend Health Check", "PASS")
            return True
        else:
            print_test("Backend Health Check", "FAIL")
            return False
    except Exception as e:
        print_test("Backend Health Check", "FAIL")
        print(f"Error: {e}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print_test("Frontend Accessibility", "PASS")
            return True
        else:
            print_test("Frontend Accessibility", "FAIL")
            return False
    except Exception as e:
        print_test("Frontend Accessibility", "FAIL")
        print(f"Error: {e}")
        return False

def register_and_login_users():
    """Register and login test users"""
    print_test("User Registration and Login")

    # Use timestamp to ensure unique emails
    timestamp = str(int(time.time()))

    # Register doctor
    doctor_data = {
        "fullName": "Dr. Sarah Johnson",
        "email": f"dr.sarah.{timestamp}@healthconnect.com",
        "password": "password123",
        "confirmPassword": "password123",
        "role": "DOCTOR",
        "specialization": "Cardiology",
        "licenseNumber": f"DOC{timestamp}",
        "affiliation": "City General Hospital",
        "yearsOfExperience": 10
    }

    # Register patient
    patient_data = {
        "fullName": "John Patient",
        "email": f"john.patient.{timestamp}@healthconnect.com",
        "password": "password123",
        "confirmPassword": "password123",
        "role": "PATIENT"
    }
    
    try:
        # Register doctor
        response = requests.post(f"{BASE_URL}/auth/register", json=doctor_data)
        if response.status_code not in [200, 201]:
            print_test("Doctor Registration", "FAIL")
            print(f"Status: {response.status_code}, Response: {response.text}")
            return None, None, None, None

        # Register patient
        response = requests.post(f"{BASE_URL}/auth/register", json=patient_data)
        if response.status_code not in [200, 201]:
            print_test("Patient Registration", "FAIL")
            print(f"Status: {response.status_code}, Response: {response.text}")
            return None, None, None, None
        
        # Login doctor
        login_data = {"email": doctor_data["email"], "password": doctor_data["password"]}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print_test("Doctor Login", "FAIL")
            return None, None, None, None
        doctor_token = response.json()["token"]
        
        # Login patient
        login_data = {"email": patient_data["email"], "password": patient_data["password"]}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print_test("Patient Login", "FAIL")
            return None, None, None, None
        patient_token = response.json()["token"]
        
        print_test("User Registration and Login", "PASS")
        return doctor_token, patient_token, doctor_data, patient_data
        
    except Exception as e:
        print_test("User Registration and Login", "FAIL")
        print(f"Error: {e}")
        return None, None, None, None

def test_doctor_discovery():
    """Test doctor discovery endpoints"""
    print_test("Doctor Discovery")
    
    try:
        # Get all doctors
        response = requests.get(f"{BASE_URL}/doctors")
        if response.status_code != 200:
            print_test("Get All Doctors", "FAIL")
            return False
        
        doctors = response.json()
        if len(doctors) == 0:
            print_test("Doctor Discovery", "FAIL")
            print("No doctors found")
            return False
        
        doctor_id = doctors[0]["id"]
        
        # Get doctor by ID
        response = requests.get(f"{BASE_URL}/doctors/{doctor_id}")
        if response.status_code != 200:
            print_test("Get Doctor by ID", "FAIL")
            return False
        
        # Get doctors by specialization
        response = requests.get(f"{BASE_URL}/doctors?specialization=Cardiology")
        if response.status_code != 200:
            print_test("Get Doctors by Specialization", "FAIL")
            return False
        
        # Get specializations
        response = requests.get(f"{BASE_URL}/doctors/specializations")
        if response.status_code != 200:
            print_test("Get Specializations", "FAIL")
            return False
        
        print_test("Doctor Discovery", "PASS")
        return doctor_id
        
    except Exception as e:
        print_test("Doctor Discovery", "FAIL")
        print(f"Error: {e}")
        return False

def test_appointment_management(doctor_token, patient_token, doctor_id):
    """Test appointment CRUD operations"""
    print_test("Appointment Management")
    
    try:
        # Create appointment as patient
        tomorrow = datetime.now() + timedelta(days=1)
        appointment_data = {
            "doctorId": doctor_id,
            "date": tomorrow.strftime("%Y-%m-%d"),
            "startTime": "10:00:00",
            "endTime": "10:30:00",
            "type": "VIDEO_CALL",
            "reasonForVisit": "Regular checkup"
        }
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        response = requests.post(f"{BASE_URL}/appointments", json=appointment_data, headers=headers)
        if response.status_code != 201:
            print_test("Create Appointment", "FAIL")
            print(f"Response: {response.status_code} - {response.text}")
            return False
        
        appointment = response.json()
        appointment_id = appointment["id"]
        print_test("Create Appointment", "PASS")
        
        # Get appointments as patient
        response = requests.get(f"{BASE_URL}/appointments", headers=headers)
        if response.status_code != 200:
            print_test("Get Patient Appointments", "FAIL")
            return False
        print_test("Get Patient Appointments", "PASS")
        
        # Get appointments as doctor
        doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.get(f"{BASE_URL}/appointments", headers=doctor_headers)
        if response.status_code != 200:
            print_test("Get Doctor Appointments", "FAIL")
            return False
        print_test("Get Doctor Appointments", "PASS")
        
        # Update appointment status (doctor confirms)
        update_data = {"status": "CONFIRMED"}
        response = requests.put(f"{BASE_URL}/appointments/{appointment_id}", 
                              json=update_data, headers=doctor_headers)
        if response.status_code != 200:
            print_test("Update Appointment Status", "FAIL")
            return False
        print_test("Update Appointment Status", "PASS")
        
        # Get today's appointments
        response = requests.get(f"{BASE_URL}/appointments/today", headers=doctor_headers)
        if response.status_code != 200:
            print_test("Get Today's Appointments", "FAIL")
            return False
        print_test("Get Today's Appointments", "PASS")
        
        print_test("Appointment Management", "PASS")
        return appointment_id
        
    except Exception as e:
        print_test("Appointment Management", "FAIL")
        print(f"Error: {e}")
        return False

def test_time_slots(doctor_id):
    """Test time slot availability"""
    print_test("Time Slot Management")
    
    try:
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/doctors/{doctor_id}/time-slots?date={date_str}")
        if response.status_code != 200:
            print_test("Get Available Time Slots", "FAIL")
            return False
        
        time_slots = response.json()
        if len(time_slots) == 0:
            print_test("Time Slot Management", "FAIL")
            print("No time slots returned")
            return False
        
        # Check if time slots have proper structure
        first_slot = time_slots[0]
        required_fields = ["date", "startTime", "endTime", "available"]
        for field in required_fields:
            if field not in first_slot:
                print_test("Time Slot Structure", "FAIL")
                return False
        
        print_test("Time Slot Management", "PASS")
        return True
        
    except Exception as e:
        print_test("Time Slot Management", "FAIL")
        print(f"Error: {e}")
        return False

def main():
    print_header("HEALTHCONNECT PHASE 2 - APPOINTMENT MANAGEMENT TEST")
    
    # Test counters
    total_tests = 0
    passed_tests = 0
    
    # Test backend health
    total_tests += 1
    if test_backend_health():
        passed_tests += 1
    else:
        print("❌ Backend is not running. Please start the backend first.")
        sys.exit(1)
    
    # Test frontend accessibility
    total_tests += 1
    if test_frontend_accessibility():
        passed_tests += 1
    
    # Register and login users
    total_tests += 1
    doctor_token, patient_token, doctor_data, patient_data = register_and_login_users()
    if doctor_token and patient_token:
        passed_tests += 1
    else:
        print("❌ User registration/login failed. Cannot proceed with appointment tests.")
        sys.exit(1)
    
    # Test doctor discovery
    total_tests += 1
    doctor_id = test_doctor_discovery()
    if doctor_id:
        passed_tests += 1
    else:
        print("❌ Doctor discovery failed. Cannot proceed with appointment tests.")
        sys.exit(1)
    
    # Test time slots
    total_tests += 1
    if test_time_slots(doctor_id):
        passed_tests += 1
    
    # Test appointment management
    total_tests += 1
    appointment_id = test_appointment_management(doctor_token, patient_token, doctor_id)
    if appointment_id:
        passed_tests += 1
    
    # Print summary
    print_header("PHASE 2 TEST SUMMARY")
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("🎉 PHASE 2 COMPLETE! Appointment management system is working perfectly.")
        print("✅ Ready to proceed to Phase 3 - Real-time Communication")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
