#!/usr/bin/env python3
"""
Simple test to verify video consultation workflow
"""
import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "http://localhost:8080"

def test_simple_workflow():
    print("🏥 HealthConnect Simple Video Test")
    print("=" * 40)
    
    # Login as patient
    patient_login = {
        "email": "patient.test@healthconnect.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json=patient_login)
    if response.status_code == 200:
        patient_data = response.json()
        patient_token = patient_data['token']
        print(f"✅ Patient login successful")
    else:
        print(f"❌ Patient login failed: {response.status_code}")
        return False
    
    # Get doctors
    headers = {"Authorization": f"Bearer {patient_token}"}
    response = requests.get(f"{BACKEND_URL}/api/users/doctors", headers=headers)
    
    if response.status_code == 200:
        doctors = response.json()
        print(f"✅ Found {len(doctors)} doctors")
        if not doctors:
            print("❌ No doctors found")
            return False
        doctor_id = doctors[0]['id']
    else:
        print(f"❌ Failed to get doctors: {response.status_code}")
        return False
    
    # Try different time slots to avoid conflicts
    for hour in [10, 11, 12, 13, 15, 16]:
        future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        appointment_data = {
            "doctorId": doctor_id,
            "date": future_date,
            "startTime": f"{hour:02d}:00",
            "endTime": f"{hour:02d}:30",
            "type": "VIDEO_CALL",
            "reasonForVisit": f"Video consultation test at {hour}:00"
        }
        
        print(f"📅 Trying appointment at {hour}:00...")
        response = requests.post(f"{BACKEND_URL}/api/appointments", 
                               json=appointment_data, headers=headers)
        
        if response.status_code == 201:
            appointment = response.json()
            print(f"✅ Video appointment created: ID {appointment['id']}")
            
            # Create video consultation
            consultation_data = {
                "appointmentId": appointment['id'],
                "type": "ROUTINE_CHECKUP"
            }
            
            response = requests.post(f"{BACKEND_URL}/api/video-consultation/create", 
                                   json=consultation_data, headers=headers)
            
            if response.status_code == 201:
                consultation = response.json()
                print(f"✅ Video consultation created: ID {consultation['id']}")
                print(f"🎥 Room ID: {consultation['roomId']}")
                print(f"📱 Frontend URL: http://localhost:4200/telemedicine/consultation/{consultation['id']}")
                print(f"🎥 Room URL: http://localhost:4200/telemedicine/room/{consultation['roomId']}")
                return True
            else:
                print(f"❌ Failed to create consultation: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        else:
            print(f"❌ Failed at {hour}:00 - {response.status_code}: {response.text}")
    
    print("❌ Could not create appointment at any time slot")
    return False

def test_backend_endpoints():
    print("\n🔍 Testing Backend Endpoints")
    print("-" * 30)
    
    # Test health endpoint
    response = requests.get(f"{BACKEND_URL}/api/health")
    if response.status_code == 200:
        health = response.json()
        print(f"✅ Health check: {health['status']}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False
    
    # Test doctors endpoint (public)
    response = requests.get(f"{BACKEND_URL}/api/doctors")
    if response.status_code == 200:
        doctors = response.json()
        print(f"✅ Public doctors endpoint: {len(doctors)} doctors")
    else:
        print(f"❌ Public doctors endpoint failed: {response.status_code}")
    
    return True

def test_frontend():
    print("\n🌐 Testing Frontend")
    print("-" * 20)
    
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200 and "HealthConnect" in response.text:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting HealthConnect System Test")
    print("=" * 50)
    
    # Test backend
    if not test_backend_endpoints():
        print("❌ Backend tests failed")
        exit(1)
    
    # Test frontend
    if not test_frontend():
        print("❌ Frontend tests failed")
        exit(1)
    
    # Test video workflow
    if test_simple_workflow():
        print("\n🎉 All tests passed! Video consultation system is working!")
    else:
        print("\n❌ Video workflow test failed")
        exit(1)
