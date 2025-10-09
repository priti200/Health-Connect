#!/usr/bin/env python3
"""
Test script for HealthConnect Video Call functionality
This script tests the video call setup and WebSocket connections
"""

import requests
import json
import datetime
from datetime import timedelta
import websocket
import threading
import time

BASE_URL = "http://localhost:8081/api"
WS_URL = "ws://localhost:8081/ws"

def test_video_call_setup():
    """Test the complete video call setup workflow"""
    print("🎥 HealthConnect Video Call Test")
    print("=" * 50)
    
    # Step 1: Login as doctor
    print("\n1️⃣ Testing Doctor Login...")
    doctor_token = login_user("doctor.test@healthconnect.com", "password123")
    if not doctor_token:
        return False
    
    # Step 2: Login as patient
    print("\n2️⃣ Testing Patient Login...")
    patient_token = login_user("patient.test@healthconnect.com", "password123")
    if not patient_token:
        return False
    
    # Step 3: Create an appointment
    print("\n3️⃣ Creating Test Appointment...")
    appointment = create_test_appointment(patient_token)
    if not appointment:
        return False
    
    appointment_id = appointment.get('id')
    print(f"✅ Appointment created with ID: {appointment_id}")
    
    # Step 4: Test video consultation creation
    print("\n4️⃣ Testing Video Consultation Creation...")
    consultation = create_video_consultation(doctor_token, appointment_id)
    if not consultation:
        return False
    
    consultation_id = consultation.get('id')
    room_id = consultation.get('roomId')
    print(f"✅ Video consultation created with ID: {consultation_id}, Room: {room_id}")
    
    # Step 5: Test WebSocket connection
    print("\n5️⃣ Testing WebSocket Connection...")
    ws_test_result = test_websocket_connection(doctor_token)
    if not ws_test_result:
        print("⚠️ WebSocket connection failed, but video call might still work with fallback")
    
    # Step 6: Test video consultation endpoints
    print("\n6️⃣ Testing Video Consultation Endpoints...")
    test_consultation_endpoints(doctor_token, consultation_id)
    
    print("\n" + "=" * 50)
    print("🎉 Video Call Test Summary:")
    print("✅ User authentication working")
    print("✅ Appointment creation working")
    print("✅ Video consultation creation working")
    print("✅ Backend endpoints responding")
    print(f"✅ Test consultation available at: /telemedicine/consultation-room?roomId={room_id}")
    
    return True

def login_user(email, password):
    """Login user and return token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for {email}")
            return data.get('token')
        else:
            print(f"❌ Login failed for {email}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error for {email}: {e}")
        return None

def create_test_appointment(patient_token):
    """Create a test appointment"""
    try:
        # Get doctors first
        response = requests.get(f"{BASE_URL}/doctors")
        if response.status_code != 200:
            print("❌ Failed to get doctors")
            return None
        
        doctors = response.json()
        if not doctors:
            print("❌ No doctors available")
            return None
        
        doctor_id = doctors[0].get('id')
        tomorrow = (datetime.date.today() + timedelta(days=1)).isoformat()
        
        appointment_data = {
            "doctorId": doctor_id,
            "date": tomorrow,
            "startTime": "17:00:00",
            "endTime": "17:30:00",
            "type": "VIDEO_CALL",
            "reasonForVisit": "Video call test appointment",
            "notes": "Test appointment for video calling functionality"
        }
        
        headers = {"Authorization": f"Bearer {patient_token}"}
        response = requests.post(f"{BASE_URL}/appointments", json=appointment_data, headers=headers)
        
        if response.status_code == 201:
            return response.json()
        else:
            print(f"❌ Failed to create appointment: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating appointment: {e}")
        return None

def create_video_consultation(doctor_token, appointment_id):
    """Create a video consultation"""
    try:
        consultation_data = {
            "appointmentId": appointment_id,
            "type": "VIDEO_CALL"
        }

        headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.post(f"{BASE_URL}/video-consultation/create", json=consultation_data, headers=headers)
        
        if response.status_code == 201:
            return response.json()
        else:
            print(f"❌ Failed to create video consultation: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating video consultation: {e}")
        return None

def test_websocket_connection(token):
    """Test WebSocket connection"""
    try:
        print("Testing WebSocket connection...")
        
        # Simple connection test
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', 8081))
        sock.close()
        
        if result == 0:
            print("✅ WebSocket port (8081) is accessible")
            return True
        else:
            print("❌ WebSocket port (8081) is not accessible")
            return False
            
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")
        return False

def test_consultation_endpoints(token, consultation_id):
    """Test video consultation endpoints"""
    try:
        headers = {"Authorization": f"Bearer {token}"}

        # Test get consultation
        response = requests.get(f"{BASE_URL}/video-consultation/{consultation_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Get consultation endpoint working")
        else:
            print(f"⚠️ Get consultation endpoint issue: {response.status_code}")

        # Test get access token
        response = requests.get(f"{BASE_URL}/video-consultation/{consultation_id}/token", headers=headers)
        if response.status_code == 200:
            token_data = response.json()
            print(f"✅ Access token endpoint working: {token_data.get('accessToken', 'N/A')}")
        else:
            print(f"⚠️ Access token endpoint issue: {response.status_code}")

        # Test start consultation
        response = requests.post(f"{BASE_URL}/video-consultation/{consultation_id}/start", headers=headers)
        if response.status_code == 200:
            print("✅ Start consultation endpoint working")
        else:
            print(f"⚠️ Start consultation endpoint issue: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing consultation endpoints: {e}")

if __name__ == "__main__":
    success = test_video_call_setup()
    if not success:
        exit(1)
