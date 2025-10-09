#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

def test_appointment_booking():
    """Test appointment booking functionality"""
    
    base_url = "http://localhost:8080/api"
    
    # Test credentials
    patient_email = "patient.test@healthconnect.com"
    patient_password = "password123"
    
    print("🧪 Testing Appointment Booking...")
    
    # Step 1: Login as patient
    print("\n1. Logging in as patient...")
    login_data = {
        "email": patient_email,
        "password": patient_password
    }
    
    login_resp = requests.post(f"{base_url}/auth/login", json=login_data)
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        print(f"Response: {login_resp.text}")
        return False
    
    patient_data = login_resp.json()
    patient_token = patient_data['token']
    print(f"✅ Login successful for: {patient_data['fullName']}")
    
    # Step 2: Get available doctors
    print("\n2. Getting available doctors...")
    doctors_resp = requests.get(f"{base_url}/doctors", 
                               headers={'Authorization': f'Bearer {patient_token}'})
    
    if doctors_resp.status_code != 200:
        print(f"❌ Failed to get doctors: {doctors_resp.status_code}")
        return False
    
    doctors = doctors_resp.json()
    if not doctors:
        print("❌ No doctors available")
        return False
    
    doctor = doctors[0]
    print(f"✅ Found doctor: {doctor['fullName']} (ID: {doctor['id']})")
    
    # Step 3: Get available time slots
    print("\n3. Getting available time slots...")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    slots_resp = requests.get(f"{base_url}/doctors/{doctor['id']}/time-slots",
                             params={'date': tomorrow},
                             headers={'Authorization': f'Bearer {patient_token}'})
    
    if slots_resp.status_code != 200:
        print(f"❌ Failed to get time slots: {slots_resp.status_code}")
        return False
    
    slots = slots_resp.json()
    available_slots = [slot for slot in slots if slot['available']]
    
    if not available_slots:
        print("❌ No available time slots")
        return False
    
    slot = available_slots[0]
    print(f"✅ Found available slot: {slot['startTime']} - {slot['endTime']}")
    
    # Step 4: Book appointment
    print("\n4. Booking appointment...")
    appointment_data = {
        'doctorId': doctor['id'],
        'date': tomorrow,
        'startTime': slot['startTime'],
        'endTime': slot['endTime'],
        'type': 'VIDEO_CALL',
        'reasonForVisit': 'Test appointment booking',
        'notes': 'This is a test appointment'
    }
    
    print(f"Request data: {json.dumps(appointment_data, indent=2)}")
    
    book_resp = requests.post(f"{base_url}/appointments",
                             json=appointment_data,
                             headers={
                                 'Authorization': f'Bearer {patient_token}',
                                 'Content-Type': 'application/json'
                             })
    
    print(f"Response status: {book_resp.status_code}")
    print(f"Response headers: {dict(book_resp.headers)}")
    print(f"Response body: {book_resp.text}")
    
    if book_resp.status_code in [200, 201]:
        appointment = book_resp.json()
        print(f"✅ Appointment booked successfully!")
        print(f"   ID: {appointment['id']}")
        print(f"   Date: {appointment['date']}")
        print(f"   Time: {appointment['startTime']} - {appointment['endTime']}")
        print(f"   Meeting Link: {appointment.get('meetingLink', 'N/A')}")
        return True
    else:
        print(f"❌ Appointment booking failed: {book_resp.status_code}")
        try:
            error_data = book_resp.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error text: {book_resp.text}")
        return False

if __name__ == "__main__":
    success = test_appointment_booking()
    if success:
        print("\n🎉 All tests passed!")
    else:
        print("\n💥 Tests failed!")
