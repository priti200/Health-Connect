#!/usr/bin/env python3
"""
Test script to verify Phase 2 (Appointments) and Phase 3 (Chat) fixes
"""

import requests
import json
from datetime import datetime, timedelta

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get('http://localhost:8080/api/test/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_frontend():
    """Test if frontend is accessible"""
    try:
        response = requests.get('http://localhost:4200', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def create_test_accounts():
    """Create or login to test accounts"""
    print("\n🔄 Setting up test accounts...")
    
    # Patient account
    patient_data = {
        'fullName': 'Test Patient',
        'email': 'patient.test@healthconnect.com',
        'password': 'password123',
        'confirmPassword': 'password123',
        'role': 'PATIENT'
    }
    
    # Try registration first, then login if exists
    try:
        response = requests.post('http://localhost:8080/api/auth/register', json=patient_data)
        if response.status_code == 200:
            print("✅ Patient account created")
            patient_result = response.json()
        else:
            # Try login
            login_resp = requests.post('http://localhost:8080/api/auth/login', 
                json={'email': 'patient.test@healthconnect.com', 'password': 'password123'})
            if login_resp.status_code == 200:
                print("✅ Patient login successful")
                patient_result = login_resp.json()
            else:
                print("❌ Patient setup failed")
                return None, None
    except Exception as e:
        print(f"❌ Patient setup error: {e}")
        return None, None
    
    # Doctor account
    doctor_data = {
        'fullName': 'Dr. Test Doctor',
        'email': 'doctor.test@healthconnect.com', 
        'password': 'password123',
        'confirmPassword': 'password123',
        'role': 'DOCTOR',
        'specialization': 'General Medicine',
        'licenseNumber': 'DOC123456',
        'affiliation': 'HealthConnect Hospital'
    }
    
    try:
        response = requests.post('http://localhost:8080/api/auth/register', json=doctor_data)
        if response.status_code == 200:
            print("✅ Doctor account created")
            doctor_result = response.json()
        else:
            # Try login
            login_resp = requests.post('http://localhost:8080/api/auth/login', 
                json={'email': 'doctor.test@healthconnect.com', 'password': 'password123'})
            if login_resp.status_code == 200:
                print("✅ Doctor login successful")
                doctor_result = login_resp.json()
            else:
                print("❌ Doctor setup failed")
                return None, None
    except Exception as e:
        print(f"❌ Doctor setup error: {e}")
        return None, None
    
    return patient_result, doctor_result

def test_appointment_api(patient_token):
    """Test appointment booking API"""
    print("\n🔄 Testing Appointment API...")
    
    try:
        # Test 1: Get available doctors
        response = requests.get('http://localhost:8080/api/doctors',
            headers={'Authorization': f'Bearer {patient_token}'})
        
        if response.status_code == 200:
            doctors = response.json()
            print(f"✅ Found {len(doctors)} doctors")
            
            if doctors:
                # Test 2: Get time slots
                doctor_id = doctors[0]['id']
                tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                
                slots_resp = requests.get(f'http://localhost:8080/api/doctors/{doctor_id}/time-slots?date={tomorrow}',
                    headers={'Authorization': f'Bearer {patient_token}'})
                
                if slots_resp.status_code == 200:
                    slots = slots_resp.json()
                    print(f"✅ Found {len(slots)} time slots for {tomorrow}")
                    return True
                else:
                    print(f"⚠️  Time slots failed: {slots_resp.status_code}")
                    return False
            else:
                print("⚠️  No doctors found")
                return False
        else:
            print(f"❌ Doctors API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Appointment API error: {e}")
        return False

def test_chat_api(patient_token, doctor_id):
    """Test chat API"""
    print("\n🔄 Testing Chat API...")
    
    try:
        # Test 1: Create chat
        response = requests.post('http://localhost:8080/api/chats',
            json={'participantId': doctor_id},
            headers={'Authorization': f'Bearer {patient_token}', 'Content-Type': 'application/json'})
        
        if response.status_code in [200, 201]:
            chat = response.json()
            chat_id = chat['id']
            print(f"✅ Chat created (ID: {chat_id})")
            
            # Test 2: Send message
            msg_resp = requests.post(f'http://localhost:8080/api/chats/{chat_id}/messages',
                json={'content': 'Hello Doctor! Test message from automated test.'},
                headers={'Authorization': f'Bearer {patient_token}', 'Content-Type': 'application/json'})
            
            if msg_resp.status_code in [200, 201]:
                print("✅ Message sent successfully")
                
                # Test 3: Get chat list
                chats_resp = requests.get('http://localhost:8080/api/chats',
                    headers={'Authorization': f'Bearer {patient_token}'})
                
                if chats_resp.status_code == 200:
                    chats = chats_resp.json()
                    print(f"✅ Chat list retrieved: {len(chats)} chats")
                    return True
                else:
                    print(f"⚠️  Chat list failed: {chats_resp.status_code}")
                    return False
            else:
                print(f"⚠️  Message sending failed: {msg_resp.status_code}")
                return False
        else:
            print(f"❌ Chat creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Chat API error: {e}")
        return False

def main():
    print("🧪 Testing HealthConnect Fixes")
    print("=" * 50)
    
    # Test infrastructure
    if not test_backend_health():
        return
    if not test_frontend():
        return
    
    # Setup accounts
    patient_result, doctor_result = create_test_accounts()
    if not patient_result or not doctor_result:
        return
    
    patient_token = patient_result['token']
    # Handle different response formats
    if 'user' in doctor_result:
        doctor_id = doctor_result['user']['id']
    else:
        doctor_id = doctor_result['id']
    
    # Test APIs
    appointment_ok = test_appointment_api(patient_token)
    chat_ok = test_chat_api(patient_token, doctor_id)
    
    # Summary
    print("\n" + "=" * 50)
    print("🎯 TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Backend Health: PASS")
    print(f"✅ Frontend Access: PASS")
    print(f"{'✅' if appointment_ok else '❌'} Appointment API: {'PASS' if appointment_ok else 'FAIL'}")
    print(f"{'✅' if chat_ok else '❌'} Chat API: {'PASS' if chat_ok else 'FAIL'}")
    
    if appointment_ok and chat_ok:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n📱 Ready to test in browser:")
        print("   • Login: http://localhost:4200")
        print("   • Appointments: http://localhost:4200/appointments")
        print("   • Chat: http://localhost:4200/chat")
        print("\n👤 Test Accounts:")
        print("   • Patient: patient.test@healthconnect.com / password123")
        print("   • Doctor: doctor.test@healthconnect.com / password123")
    else:
        print("\n⚠️  Some tests failed. Check the logs above.")

if __name__ == "__main__":
    main()
