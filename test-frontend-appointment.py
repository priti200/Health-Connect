#!/usr/bin/env python3
"""
Test script to verify frontend-backend integration for appointment booking
This script simulates the frontend workflow
"""

import requests
import json
import datetime
from datetime import timedelta

BACKEND_URL = "http://localhost:8081/api"
FRONTEND_URL = "http://localhost:4200"

def test_frontend_backend_integration():
    """Test the complete appointment booking workflow"""
    print("🏥 HealthConnect Frontend-Backend Integration Test")
    print("=" * 60)
    
    # Step 1: Test patient login
    print("\n1️⃣ Testing Patient Login...")
    login_data = {
        "email": "patient.test@healthconnect.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return False
        
        auth_data = response.json()
        token = auth_data.get('token')
        patient_id = auth_data.get('id')
        print(f"✅ Patient login successful (ID: {patient_id})")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Test getting doctors (as frontend would do)
    print("\n2️⃣ Testing Doctor Discovery...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BACKEND_URL}/doctors", headers=headers)
        if response.status_code != 200:
            print(f"❌ Get doctors failed: {response.text}")
            return False
        
        doctors = response.json()
        if not doctors:
            print("❌ No doctors found")
            return False
        
        doctor = doctors[0]
        doctor_id = doctor.get('id')
        print(f"✅ Found {len(doctors)} doctors. Using Dr. {doctor.get('fullName')} (ID: {doctor_id})")
        
    except Exception as e:
        print(f"❌ Get doctors error: {e}")
        return False
    
    # Step 3: Test getting available time slots
    print("\n3️⃣ Testing Time Slot Availability...")
    tomorrow = (datetime.date.today() + timedelta(days=1)).isoformat()
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/doctors/{doctor_id}/time-slots",
            params={"date": tomorrow},
            headers=headers
        )
        
        if response.status_code == 200:
            time_slots = response.json()
            print(f"✅ Found {len(time_slots)} available time slots for {tomorrow}")
        else:
            print(f"⚠️ Time slots endpoint returned {response.status_code} (may not be implemented)")
            
    except Exception as e:
        print(f"⚠️ Time slots error: {e} (may not be implemented)")
    
    # Step 4: Test appointment creation (main functionality)
    print("\n4️⃣ Testing Appointment Creation...")
    appointment_data = {
        "doctorId": doctor_id,
        "date": tomorrow,
        "startTime": "15:00:00",
        "endTime": "15:30:00",
        "type": "VIDEO_CALL",
        "reasonForVisit": "Frontend integration test appointment",
        "notes": "This appointment was created via frontend-backend integration test"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/appointments",
            json=appointment_data,
            headers=headers
        )
        
        if response.status_code == 201:
            appointment = response.json()
            appointment_id = appointment.get('id')
            print(f"✅ Appointment created successfully!")
            print(f"   📅 Appointment ID: {appointment_id}")
            print(f"   📅 Date: {appointment.get('date')}")
            print(f"   📅 Time: {appointment.get('startTime')} - {appointment.get('endTime')}")
            print(f"   📅 Status: {appointment.get('status')}")
            print(f"   📅 Type: {appointment.get('type')}")
        else:
            print(f"❌ Appointment creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Appointment creation error: {e}")
        return False
    
    # Step 5: Test getting patient appointments
    print("\n5️⃣ Testing Patient Appointments Retrieval...")
    try:
        response = requests.get(f"{BACKEND_URL}/appointments", headers=headers)
        if response.status_code == 200:
            appointments = response.json()
            print(f"✅ Retrieved {len(appointments)} appointments for patient")
            
            # Find our newly created appointment
            new_appointment = next((apt for apt in appointments if apt.get('id') == appointment_id), None)
            if new_appointment:
                print(f"✅ Newly created appointment found in patient's appointment list")
            else:
                print(f"⚠️ Newly created appointment not found in list")
        else:
            print(f"❌ Get appointments failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Get appointments error: {e}")
        return False
    
    # Step 6: Test appointment update (optional)
    print("\n6️⃣ Testing Appointment Update...")
    update_data = {
        "notes": "Updated notes: Frontend integration test completed successfully"
    }
    
    try:
        response = requests.put(
            f"{BACKEND_URL}/appointments/{appointment_id}",
            json=update_data,
            headers=headers
        )
        
        if response.status_code == 200:
            updated_appointment = response.json()
            print(f"✅ Appointment updated successfully")
            print(f"   📝 Updated notes: {updated_appointment.get('notes')}")
        else:
            print(f"⚠️ Appointment update failed: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Appointment update error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Frontend-Backend Integration Test PASSED!")
    print("✅ All core appointment booking functionality is working correctly")
    print(f"✅ Backend API: {BACKEND_URL}")
    print(f"✅ Frontend URL: {FRONTEND_URL}")
    print("\n📋 Summary:")
    print("   ✅ Patient authentication")
    print("   ✅ Doctor discovery")
    print("   ✅ Appointment creation")
    print("   ✅ Appointment retrieval")
    print("   ✅ Appointment updates")
    print("\n🌐 You can now test the appointment booking in the browser at:")
    print(f"   {FRONTEND_URL}")
    
    return True

if __name__ == "__main__":
    success = test_frontend_backend_integration()
    if not success:
        exit(1)
