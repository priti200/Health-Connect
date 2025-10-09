#!/usr/bin/env python3
"""
Quick test script to verify video consultation workflow
"""
import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "http://localhost:8080"

def test_login():
    """Test login with existing test users"""
    print("🔐 Testing login...")
    
    # Login as patient
    patient_login = {
        "email": "patient.test@healthconnect.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json=patient_login)
    if response.status_code == 200:
        patient_data = response.json()
        print(f"✅ Patient login successful")
        print(f"Response: {json.dumps(patient_data, indent=2)}")
        patient_token = patient_data.get('token') or patient_data.get('accessToken')
    else:
        print(f"❌ Patient login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None, None

    # Login as doctor
    doctor_login = {
        "email": "doctor.test@healthconnect.com",
        "password": "password123"
    }

    response = requests.post(f"{BACKEND_URL}/api/auth/login", json=doctor_login)
    if response.status_code == 200:
        doctor_data = response.json()
        print(f"✅ Doctor login successful")
        print(f"Response: {json.dumps(doctor_data, indent=2)}")
        doctor_token = doctor_data.get('token') or doctor_data.get('accessToken')
    else:
        print(f"❌ Doctor login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return patient_token, None
    
    return patient_token, doctor_token

def test_create_video_appointment(patient_token, doctor_id):
    """Create a video appointment"""
    print("\n📅 Creating video appointment...")
    
    headers = {"Authorization": f"Bearer {patient_token}"}
    
    # Get a date 3 days in the future to avoid validation issues
    future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    
    appointment_data = {
        "doctorId": doctor_id,
        "date": future_date,
        "startTime": "14:00",
        "endTime": "14:30",
        "type": "VIDEO_CALL",
        "reasonForVisit": "Video consultation test"
    }
    
    response = requests.post(f"{BACKEND_URL}/api/appointments", 
                           json=appointment_data, headers=headers)
    
    if response.status_code == 201:
        appointment = response.json()
        print(f"✅ Video appointment created: ID {appointment['id']}")
        return appointment
    else:
        print(f"❌ Failed to create appointment: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_create_video_consultation(patient_token, appointment_id):
    """Create video consultation from appointment"""
    print("\n🎥 Creating video consultation...")
    
    headers = {"Authorization": f"Bearer {patient_token}"}
    
    consultation_data = {
        "appointmentId": appointment_id,
        "type": "ROUTINE_CHECKUP"
    }
    
    response = requests.post(f"{BACKEND_URL}/api/video-consultation/create", 
                           json=consultation_data, headers=headers)
    
    if response.status_code == 201:
        consultation = response.json()
        print(f"✅ Video consultation created: ID {consultation['id']}, Room: {consultation['roomId']}")
        return consultation
    else:
        print(f"❌ Failed to create consultation: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_get_doctors(patient_token):
    """Get list of doctors"""
    print("\n👨‍⚕️ Getting doctors list...")
    
    headers = {"Authorization": f"Bearer {patient_token}"}
    response = requests.get(f"{BACKEND_URL}/api/users/doctors", headers=headers)
    
    if response.status_code == 200:
        doctors = response.json()
        print(f"✅ Found {len(doctors)} doctors")
        if doctors:
            return doctors[0]['id']  # Return first doctor's ID
    else:
        print(f"❌ Failed to get doctors: {response.status_code}")
    
    return None

def main():
    print("🏥 HealthConnect Video Consultation Flow Test")
    print("=" * 50)
    
    # Test login
    patient_token, doctor_token = test_login()
    if not patient_token or not doctor_token:
        print("❌ Login failed, cannot continue")
        return
    
    # Get doctors
    doctor_id = test_get_doctors(patient_token)
    if not doctor_id:
        print("❌ No doctors found, cannot continue")
        return
    
    # Create video appointment
    appointment = test_create_video_appointment(patient_token, doctor_id)
    if not appointment:
        print("❌ Failed to create appointment, cannot continue")
        return
    
    # Create video consultation
    consultation = test_create_video_consultation(patient_token, appointment['id'])
    if not consultation:
        print("❌ Failed to create consultation")
        return
    
    print("\n🎉 Video consultation workflow test completed successfully!")
    print(f"📱 Frontend URL: http://localhost:4200/telemedicine/consultation/{consultation['id']}")
    print(f"🎥 Room URL: http://localhost:4200/telemedicine/room/{consultation['roomId']}")

if __name__ == "__main__":
    main()
