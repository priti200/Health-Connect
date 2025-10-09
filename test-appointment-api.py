#!/usr/bin/env python3
"""
Test script for HealthConnect Appointment API
This script tests the appointment booking functionality
"""

import requests
import json
import datetime
from datetime import timedelta

BASE_URL = "http://localhost:8081/api"

def test_login(email, password):
    """Test user login and return token"""
    print(f"🔐 Testing login for {email}...")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for {email}")
            print(f"User ID: {data.get('id')}")
            print(f"Role: {data.get('role')}")
            return data.get('token')
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_get_doctors():
    """Test getting list of doctors"""
    print("\n👨‍⚕️ Testing get doctors...")
    
    try:
        response = requests.get(f"{BASE_URL}/doctors")
        print(f"Get doctors response status: {response.status_code}")
        
        if response.status_code == 200:
            doctors = response.json()
            print(f"✅ Found {len(doctors)} doctors")
            for doctor in doctors:
                print(f"  - Dr. {doctor.get('fullName')} (ID: {doctor.get('id')}) - {doctor.get('specialization')}")
            return doctors
        else:
            print(f"❌ Get doctors failed: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Get doctors error: {e}")
        return []

def test_create_appointment(token, doctor_id):
    """Test creating an appointment"""
    print(f"\n📅 Testing appointment creation with doctor ID {doctor_id}...")
    
    # Create appointment for tomorrow
    tomorrow = datetime.date.today() + timedelta(days=1)
    
    appointment_data = {
        "doctorId": doctor_id,
        "date": tomorrow.isoformat(),
        "startTime": "14:00:00",
        "endTime": "14:30:00",
        "type": "VIDEO_CALL",
        "reasonForVisit": "Test appointment booking",
        "notes": "This is a test appointment created via API"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/appointments", json=appointment_data, headers=headers)
        print(f"Create appointment response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            appointment = response.json()
            print(f"✅ Appointment created successfully!")
            print(f"Appointment ID: {appointment.get('id')}")
            print(f"Date: {appointment.get('date')}")
            print(f"Time: {appointment.get('startTime')} - {appointment.get('endTime')}")
            print(f"Status: {appointment.get('status')}")
            return appointment
        else:
            print(f"❌ Appointment creation failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Appointment creation error: {e}")
        return None

def test_get_appointments(token):
    """Test getting user's appointments"""
    print("\n📋 Testing get appointments...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/appointments", headers=headers)
        print(f"Get appointments response status: {response.status_code}")
        
        if response.status_code == 200:
            appointments = response.json()
            print(f"✅ Found {len(appointments)} appointments")
            for apt in appointments:
                print(f"  - ID: {apt.get('id')}, Date: {apt.get('date')}, Status: {apt.get('status')}")
            return appointments
        else:
            print(f"❌ Get appointments failed: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Get appointments error: {e}")
        return []

def main():
    print("🏥 HealthConnect Appointment API Test")
    print("=" * 50)
    
    # Test patient login
    patient_token = test_login("patient.test@healthconnect.com", "password123")
    if not patient_token:
        print("❌ Cannot proceed without patient token")
        return
    
    # Get doctors
    doctors = test_get_doctors()
    if not doctors:
        print("❌ No doctors found")
        return
    
    # Use first doctor for testing
    doctor_id = doctors[0].get('id')
    
    # Test appointment creation
    appointment = test_create_appointment(patient_token, doctor_id)
    
    # Test getting appointments
    appointments = test_get_appointments(patient_token)
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main()
