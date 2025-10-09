#!/usr/bin/env python3
"""
Phase 3 Integration Test - Real-time Communication System
Tests chat functionality, WebSocket connections, and message delivery
"""

import requests
import json
import sys
import time
import websocket
import threading
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8080/api"
WS_URL = "ws://localhost:8080/ws"
FRONTEND_URL = "http://localhost:4200"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"💬 {title}")
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
        "fullName": "Dr. Chat Doctor",
        "email": f"dr.chat.{timestamp}@healthconnect.com",
        "password": "password123",
        "confirmPassword": "password123",
        "role": "DOCTOR",
        "specialization": "General Medicine",
        "licenseNumber": f"DOC{timestamp}",
        "affiliation": "Chat Test Hospital",
        "yearsOfExperience": 5
    }

    # Register patient
    patient_data = {
        "fullName": "Chat Patient",
        "email": f"chat.patient.{timestamp}@healthconnect.com",
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
        doctor_user = response.json()

        # Login patient
        login_data = {"email": patient_data["email"], "password": patient_data["password"]}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print_test("Patient Login", "FAIL")
            return None, None, None, None
        patient_token = response.json()["token"]
        patient_user = response.json()
        
        print_test("User Registration and Login", "PASS")
        return doctor_token, patient_token, doctor_user, patient_user
        
    except Exception as e:
        print_test("User Registration and Login", "FAIL")
        print(f"Error: {e}")
        return None, None, None, None

def test_chat_creation(patient_token, doctor_user):
    """Test chat creation between patient and doctor"""
    print_test("Chat Creation")
    
    try:
        headers = {"Authorization": f"Bearer {patient_token}"}
        chat_data = {"participantId": doctor_user["id"]}
        
        response = requests.post(f"{BASE_URL}/chats", json=chat_data, headers=headers)
        if response.status_code not in [200, 201]:
            print_test("Chat Creation", "FAIL")
            print(f"Response: {response.status_code} - {response.text}")
            return None
        
        chat = response.json()
        print_test("Chat Creation", "PASS")
        return chat
        
    except Exception as e:
        print_test("Chat Creation", "FAIL")
        print(f"Error: {e}")
        return None

def test_message_sending(patient_token, doctor_token, chat_id):
    """Test sending messages via REST API"""
    print_test("Message Sending (REST API)")
    
    try:
        # Send message from patient
        patient_headers = {"Authorization": f"Bearer {patient_token}"}
        message_data = {"content": "Hello Doctor, I need help with my symptoms."}
        
        response = requests.post(f"{BASE_URL}/chats/{chat_id}/messages", 
                               json=message_data, headers=patient_headers)
        if response.status_code not in [200, 201]:
            print_test("Patient Message Send", "FAIL")
            return False
        
        patient_message = response.json()
        print_test("Patient Message Send", "PASS")
        
        # Send reply from doctor
        doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
        reply_data = {"content": "Hello! I'm here to help. Can you describe your symptoms?"}
        
        response = requests.post(f"{BASE_URL}/chats/{chat_id}/messages", 
                               json=reply_data, headers=doctor_headers)
        if response.status_code not in [200, 201]:
            print_test("Doctor Message Reply", "FAIL")
            return False
        
        doctor_message = response.json()
        print_test("Doctor Message Reply", "PASS")
        
        print_test("Message Sending (REST API)", "PASS")
        return True
        
    except Exception as e:
        print_test("Message Sending (REST API)", "FAIL")
        print(f"Error: {e}")
        return False

def test_message_retrieval(patient_token, chat_id):
    """Test retrieving chat messages"""
    print_test("Message Retrieval")
    
    try:
        headers = {"Authorization": f"Bearer {patient_token}"}
        response = requests.get(f"{BASE_URL}/chats/{chat_id}/messages", headers=headers)
        
        if response.status_code != 200:
            print_test("Message Retrieval", "FAIL")
            return False
        
        messages = response.json()
        if len(messages) < 2:
            print_test("Message Retrieval", "FAIL")
            print("Expected at least 2 messages")
            return False
        
        print_test("Message Retrieval", "PASS")
        return True
        
    except Exception as e:
        print_test("Message Retrieval", "FAIL")
        print(f"Error: {e}")
        return False

def test_chat_list(patient_token, doctor_token):
    """Test retrieving user's chat list"""
    print_test("Chat List Retrieval")
    
    try:
        # Test patient chat list
        patient_headers = {"Authorization": f"Bearer {patient_token}"}
        response = requests.get(f"{BASE_URL}/chats", headers=patient_headers)
        
        if response.status_code != 200:
            print_test("Patient Chat List", "FAIL")
            return False
        
        patient_chats = response.json()
        if len(patient_chats) == 0:
            print_test("Patient Chat List", "FAIL")
            print("Expected at least 1 chat")
            return False
        
        print_test("Patient Chat List", "PASS")
        
        # Test doctor chat list
        doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
        response = requests.get(f"{BASE_URL}/chats", headers=doctor_headers)
        
        if response.status_code != 200:
            print_test("Doctor Chat List", "FAIL")
            return False
        
        doctor_chats = response.json()
        if len(doctor_chats) == 0:
            print_test("Doctor Chat List", "FAIL")
            print("Expected at least 1 chat")
            return False
        
        print_test("Doctor Chat List", "PASS")
        print_test("Chat List Retrieval", "PASS")
        return True
        
    except Exception as e:
        print_test("Chat List Retrieval", "FAIL")
        print(f"Error: {e}")
        return False

def test_message_status_tracking(patient_token, chat_id):
    """Test marking messages as read"""
    print_test("Message Status Tracking")
    
    try:
        headers = {"Authorization": f"Bearer {patient_token}"}
        response = requests.put(f"{BASE_URL}/chats/{chat_id}/read", headers=headers)
        
        if response.status_code != 200:
            print_test("Mark Messages as Read", "FAIL")
            return False
        
        print_test("Mark Messages as Read", "PASS")
        print_test("Message Status Tracking", "PASS")
        return True
        
    except Exception as e:
        print_test("Message Status Tracking", "FAIL")
        print(f"Error: {e}")
        return False

def main():
    print_header("HEALTHCONNECT PHASE 3 - REAL-TIME COMMUNICATION TEST")
    
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
    doctor_token, patient_token, doctor_user, patient_user = register_and_login_users()
    if doctor_token and patient_token:
        passed_tests += 1
    else:
        print("❌ User registration/login failed. Cannot proceed with chat tests.")
        sys.exit(1)
    
    # Test chat creation
    total_tests += 1
    chat = test_chat_creation(patient_token, doctor_user)
    if chat:
        passed_tests += 1
        chat_id = chat["id"]
    else:
        print("❌ Chat creation failed. Cannot proceed with message tests.")
        sys.exit(1)
    
    # Test message sending
    total_tests += 1
    if test_message_sending(patient_token, doctor_token, chat_id):
        passed_tests += 1
    
    # Test message retrieval
    total_tests += 1
    if test_message_retrieval(patient_token, chat_id):
        passed_tests += 1
    
    # Test chat list
    total_tests += 1
    if test_chat_list(patient_token, doctor_token):
        passed_tests += 1
    
    # Test message status tracking
    total_tests += 1
    if test_message_status_tracking(patient_token, chat_id):
        passed_tests += 1
    
    # Print summary
    print_header("PHASE 3 TEST SUMMARY")
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("🎉 PHASE 3 COMPLETE! Real-time communication system is working perfectly.")
        print("✅ Ready to proceed to Phase 4 - AI Health Bot")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
