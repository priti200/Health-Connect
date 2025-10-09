#!/usr/bin/env python3
"""
Test the specific video consultation endpoints that were failing
"""
import requests
import json

def test_endpoints():
    base_url = "http://localhost:8080"
    
    # Login as patient to get token
    print("🔐 Logging in as patient...")
    login_response = requests.post(f"{base_url}/api/auth/login", json={
        "email": "patient.test@healthconnect.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()['token']
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Test the endpoints that were failing
    print("\n🧪 Testing the endpoints that were previously failing...")
    
    # Test user consultations endpoint
    print("📋 Testing /api/video-consultation/user/consultations...")
    consultations_response = requests.get(
        f"{base_url}/api/video-consultation/user/consultations", 
        headers=headers
    )
    
    if consultations_response.status_code == 200:
        consultations = consultations_response.json()
        print(f"✅ User consultations endpoint SUCCESS: {len(consultations)} consultations found")
    else:
        print(f"❌ User consultations endpoint FAILED: {consultations_response.status_code}")
        print(f"   Response: {consultations_response.text}")
        return False
    
    # Test upcoming consultations endpoint
    print("📅 Testing /api/video-consultation/user/upcoming...")
    upcoming_response = requests.get(
        f"{base_url}/api/video-consultation/user/upcoming", 
        headers=headers
    )
    
    if upcoming_response.status_code == 200:
        upcoming = upcoming_response.json()
        print(f"✅ Upcoming consultations endpoint SUCCESS: {len(upcoming)} upcoming consultations")
    else:
        print(f"❌ Upcoming consultations endpoint FAILED: {upcoming_response.status_code}")
        print(f"   Response: {upcoming_response.text}")
        return False
    
    print("\n🎉 ALL ENDPOINTS ARE WORKING! The 500 errors are fixed!")
    return True

if __name__ == "__main__":
    print("🔍 VERIFYING VIDEO CONSULTATION ENDPOINTS FIX")
    print("=" * 50)
    
    success = test_endpoints()
    
    if success:
        print("\n✅ CONFIRMATION: The video consultation 500 errors are FIXED!")
        print("📍 You can now use the frontend without errors")
        print("📍 Go to http://localhost:4200 and navigate to Telemedicine")
    else:
        print("\n❌ VERIFICATION FAILED: Issues still exist")
