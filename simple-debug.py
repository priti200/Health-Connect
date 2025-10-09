#!/usr/bin/env python3
"""
Simple debug for appointment booking
"""

import requests
import json

def test_complete_appointment_flow():
    """Test the complete appointment booking flow"""
    print("🧪 Testing Complete Appointment Booking Flow")
    print("=" * 60)
    
    # Step 1: Login as patient
    print("1️⃣ Logging in as patient...")
    login_resp = requests.post('http://localhost:8080/api/auth/login', 
        json={'email': 'patient.test@healthconnect.com', 'password': 'password123'})
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        return False
    
    patient_data = login_resp.json()
    patient_token = patient_data['token']
    print("✅ Patient login successful")
    
    # Step 2: Get available doctors
    print("\n2️⃣ Getting available doctors...")
    doctors_resp = requests.get('http://localhost:8080/api/doctors',
        headers={'Authorization': f'Bearer {patient_token}'})
    
    if doctors_resp.status_code != 200:
        print(f"❌ Failed to get doctors: {doctors_resp.status_code}")
        return False
    
    doctors = doctors_resp.json()
    print(f"✅ Found {len(doctors)} doctors")
    
    if not doctors:
        print("❌ No doctors available")
        return False
    
    doctor = doctors[0]
    doctor_id = doctor['id']
    print(f"   Selected doctor: {doctor['fullName']} (ID: {doctor_id})")
    
    # Step 3: Get available time slots
    print("\n3️⃣ Getting available time slots...")
    date = '2025-06-10'  # Tomorrow
    slots_resp = requests.get(f'http://localhost:8080/api/doctors/{doctor_id}/time-slots?date={date}',
        headers={'Authorization': f'Bearer {patient_token}'})
    
    if slots_resp.status_code != 200:
        print(f"❌ Failed to get time slots: {slots_resp.status_code}")
        return False
    
    slots = slots_resp.json()
    available_slots = [slot for slot in slots if slot['available']]
    print(f"✅ Found {len(available_slots)} available time slots")
    
    if not available_slots:
        print("❌ No available time slots")
        return False
    
    slot = available_slots[0]
    print(f"   Selected slot: {slot['startTime']} - {slot['endTime']}")
    
    # Step 4: Book appointment
    print("\n4️⃣ Booking appointment...")
    appointment_data = {
        'doctorId': doctor_id,
        'date': date,
        'startTime': slot['startTime'],
        'endTime': slot['endTime'],
        'type': 'IN_PERSON',
        'reasonForVisit': 'Complete flow test appointment',
        'notes': 'This is a test appointment to verify the booking system'
    }
    
    print(f"   Booking data: {json.dumps(appointment_data, indent=2)}")
    
    book_resp = requests.post('http://localhost:8080/api/appointments',
        json=appointment_data,
        headers={'Authorization': f'Bearer {patient_token}', 'Content-Type': 'application/json'})
    
    print(f"   Response status: {book_resp.status_code}")
    print(f"   Response headers: {dict(book_resp.headers)}")
    
    if book_resp.status_code in [200, 201]:
        appointment = book_resp.json()
        print("✅ Appointment booked successfully!")
        print(f"   Appointment ID: {appointment['id']}")
        print(f"   Status: {appointment['status']}")
        print(f"   Date: {appointment['date']} {appointment['startTime']}-{appointment['endTime']}")
        return True
    else:
        print(f"❌ Appointment booking failed!")
        print(f"   Error response: {book_resp.text}")
        return False

def test_frontend_endpoints():
    """Test endpoints that frontend uses"""
    print("\n🌐 Testing Frontend Endpoints")
    print("=" * 60)
    
    # Test frontend accessibility
    try:
        frontend_resp = requests.get('http://localhost:4200', timeout=5)
        if frontend_resp.status_code == 200:
            print("✅ Frontend is accessible")
        else:
            print(f"⚠️  Frontend returned: {frontend_resp.status_code}")
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
    
    # Test appointment booking page
    try:
        booking_resp = requests.get('http://localhost:4200/appointments/book', timeout=5)
        if booking_resp.status_code == 200:
            print("✅ Appointment booking page accessible")
        else:
            print(f"⚠️  Booking page returned: {booking_resp.status_code}")
    except Exception as e:
        print(f"❌ Booking page not accessible: {e}")

def check_backend_logs():
    """Check for any obvious backend issues"""
    print("\n🔍 Backend Health Check")
    print("=" * 60)
    
    try:
        health_resp = requests.get('http://localhost:8080/api/test/health', timeout=5)
        if health_resp.status_code == 200:
            health_data = health_resp.json()
            print("✅ Backend is healthy")
            print(f"   Status: {health_data.get('status', 'Unknown')}")
            print(f"   Message: {health_data.get('message', 'No message')}")
        else:
            print(f"❌ Backend health check failed: {health_resp.status_code}")
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")

def main():
    print("🔧 HealthConnect Appointment Booking Debug")
    print("=" * 60)
    
    # Check backend health
    check_backend_logs()
    
    # Test frontend endpoints
    test_frontend_endpoints()
    
    # Test complete flow
    flow_ok = test_complete_appointment_flow()
    
    print("\n" + "=" * 60)
    print("🎯 FINAL DIAGNOSIS")
    print("=" * 60)
    
    if flow_ok:
        print("✅ BACKEND API: Working perfectly!")
        print("❓ FRONTEND ISSUE: The problem is in the browser/frontend")
        print("\n🔧 RECOMMENDED ACTIONS:")
        print("1. Open browser developer tools (F12)")
        print("2. Go to Console tab")
        print("3. Navigate to: http://localhost:4200/appointments/book")
        print("4. Try to book an appointment")
        print("5. Check for JavaScript errors in console")
        print("6. Check Network tab for failed API calls")
        print("\n📋 MANUAL TEST STEPS:")
        print("• Login: patient.test@healthconnect.com / password123")
        print("• Navigate to Appointments > Book Appointment")
        print("• Select doctor from dropdown")
        print("• Choose date (tomorrow or later)")
        print("• Select available time slot")
        print("• Fill reason for visit")
        print("• Click 'Book Appointment'")
        print("• Check console for errors")
    else:
        print("❌ BACKEND API: Has issues!")
        print("🔧 Fix backend issues first before testing frontend")

if __name__ == "__main__":
    main()
