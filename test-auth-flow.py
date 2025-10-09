#!/usr/bin/env python3
"""
Test authentication flow and video consultation access
"""
import requests
import json

BACKEND_URL = "http://localhost:8080"

def test_auth_and_consultation():
    print("🔐 Testing authentication and video consultation access...")
    
    # Login as patient
    patient_login = {
        "email": "patient.test@healthconnect.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json=patient_login)
    if response.status_code == 200:
        patient_data = response.json()
        patient_token = patient_data['token']
        print(f"✅ Patient login successful: {patient_data['fullName']}")
    else:
        print(f"❌ Patient login failed: {response.status_code}")
        return
    
    # Test accessing video consultation with authentication
    headers = {"Authorization": f"Bearer {patient_token}"}
    
    # Try to get consultation by ID
    consultation_id = 1
    response = requests.get(f"{BACKEND_URL}/api/video-consultation/{consultation_id}", headers=headers)
    
    if response.status_code == 200:
        consultation = response.json()
        print(f"✅ Successfully accessed consultation: {consultation['id']}")
        print(f"   Room ID: {consultation['roomId']}")
        print(f"   Status: {consultation['status']}")
        print(f"   Type: {consultation['type']}")
    else:
        print(f"❌ Failed to access consultation: {response.status_code}")
        print(f"   Response: {response.text}")
    
    # Test WebSocket health endpoint
    response = requests.get(f"{BACKEND_URL}/api/health/websocket", headers=headers)
    if response.status_code == 200:
        print(f"✅ WebSocket health check passed")
    else:
        print(f"❌ WebSocket health check failed: {response.status_code}")

if __name__ == "__main__":
    test_auth_and_consultation()
