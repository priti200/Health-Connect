#!/usr/bin/env python3
"""
Phase 1 Integration Test - User Management & Authentication
Tests the complete authentication flow for HealthConnect
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:4200"

class Phase1Tester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.doctor_token = None
        self.patient_token = None
        
    def log_test(self, test_name, success, message=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message
        })
        
    def test_backend_health(self):
        """Test if backend is running"""
        try:
            response = requests.get(f"{BACKEND_URL}/api/test/health", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.log_test("Backend Health Check", True, 
                             f"Status: {data.get('status', 'UP')}")
            else:
                self.log_test("Backend Health Check", False, 
                             f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Error: {str(e)}")
            return False
            
    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            success = response.status_code == 200
            self.log_test("Frontend Accessibility", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Frontend Accessibility", False, f"Error: {str(e)}")
            return False
            
    def test_doctor_registration(self):
        """Test doctor registration"""
        doctor_data = {
            "fullName": "Dr. John Smith",
            "email": "doctor.test@healthconnect.com",
            "password": "password123",
            "confirmPassword": "password123",
            "role": "DOCTOR",
            "specialization": "Cardiology",
            "licenseNumber": "DOC123456789",
            "affiliation": "City General Hospital",
            "yearsOfExperience": 10,
            "phoneNumber": "+1234567890",
            "address": "123 Medical Center Dr"
        }

        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/register",
                                   json=doctor_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.doctor_token = data.get("token")
                self.log_test("Doctor Registration", True,
                             f"Doctor ID: {data.get('id')}")
                return True
            else:
                self.log_test("Doctor Registration", False,
                             f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Doctor Registration", False, f"Error: {str(e)}")
            return False

    def test_patient_registration(self):
        """Test patient registration"""
        patient_data = {
            "fullName": "Jane Doe",
            "email": "patient.test@healthconnect.com",
            "password": "password123",
            "confirmPassword": "password123",
            "role": "PATIENT",
            "phoneNumber": "+1987654321",
            "address": "456 Patient St"
        }

        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/register",
                                   json=patient_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.patient_token = data.get("token")
                self.log_test("Patient Registration", True,
                             f"Patient ID: {data.get('id')}")
                return True
            else:
                self.log_test("Patient Registration", False,
                             f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Patient Registration", False, f"Error: {str(e)}")
            return False
            
    def test_doctor_login(self):
        """Test doctor login"""
        login_data = {
            "email": "doctor.test@healthconnect.com",
            "password": "password123",
            "rememberMe": False
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/login",
                                   json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.doctor_token = data.get("token")
                self.log_test("Doctor Login", True, "Login successful")
                return True
            else:
                self.log_test("Doctor Login", False,
                             f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Doctor Login", False, f"Error: {str(e)}")
            return False
            
    def test_patient_login(self):
        """Test patient login"""
        login_data = {
            "email": "patient.test@healthconnect.com",
            "password": "password123",
            "rememberMe": False
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/api/auth/login",
                                   json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.patient_token = data.get("token")
                self.log_test("Patient Login", True, "Login successful")
                return True
            else:
                self.log_test("Patient Login", False,
                             f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Patient Login", False, f"Error: {str(e)}")
            return False
            
    def test_protected_endpoints(self):
        """Test protected endpoints with authentication"""
        if not self.doctor_token:
            self.log_test("Protected Endpoints", False, "No doctor token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        try:
            # Test getting current user profile
            response = requests.get(f"{BACKEND_URL}/api/users/me", 
                                  headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Get User Profile", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Protected Endpoints", False, f"Error: {str(e)}")
            return False
            
    def test_profile_update(self):
        """Test profile update functionality"""
        if not self.patient_token:
            self.log_test("Profile Update", False, "No patient token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.patient_token}"}
        update_data = {
            "fullName": "Jane Smith Doe",
            "phoneNumber": "+1555123456",
            "address": "789 Updated Address St"
        }
        
        try:
            response = requests.put(f"{BACKEND_URL}/api/users/me",
                                  json=update_data, headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Profile Update", success,
                         f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Profile Update", False, f"Error: {str(e)}")
            return False
            
    def test_role_based_access(self):
        """Test role-based access control"""
        if not self.patient_token or not self.doctor_token:
            self.log_test("Role-based Access", False, "Missing tokens")
            return False
            
        # Test that patient can access their own profile
        patient_headers = {"Authorization": f"Bearer {self.patient_token}"}
        doctor_headers = {"Authorization": f"Bearer {self.doctor_token}"}
        
        try:
            # Both should be able to access their own profiles
            patient_response = requests.get(f"{BACKEND_URL}/api/users/me", 
                                          headers=patient_headers, timeout=10)
            doctor_response = requests.get(f"{BACKEND_URL}/api/users/me", 
                                         headers=doctor_headers, timeout=10)
            
            success = (patient_response.status_code == 200 and 
                      doctor_response.status_code == 200)
            self.log_test("Role-based Access", success,
                         f"Patient: {patient_response.status_code}, Doctor: {doctor_response.status_code}")
            return success
        except Exception as e:
            self.log_test("Role-based Access", False, f"Error: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all Phase 1 tests"""
        print("🏥 HEALTHCONNECT PHASE 1 - AUTHENTICATION TEST")
        print("=" * 60)
        
        # Basic connectivity tests
        if not self.test_backend_health():
            print("❌ Backend not accessible. Please start the backend first.")
            return False
            
        self.test_frontend_accessibility()
        
        # Authentication flow tests
        print("\n📝 Testing Registration...")
        self.test_doctor_registration()
        time.sleep(1)
        self.test_patient_registration()
        time.sleep(1)
        
        print("\n🔐 Testing Login...")
        self.test_doctor_login()
        time.sleep(1)
        self.test_patient_login()
        time.sleep(1)
        
        print("\n🛡️ Testing Protected Access...")
        self.test_protected_endpoints()
        time.sleep(1)
        self.test_profile_update()
        time.sleep(1)
        self.test_role_based_access()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 PHASE 1 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 PHASE 1 COMPLETE! Authentication system is working perfectly.")
            print("✅ Ready to proceed to Phase 2 - Appointment Management")
            return True
        else:
            print("⚠️  Some tests failed. Please review and fix issues before proceeding.")
            return False

if __name__ == "__main__":
    tester = Phase1Tester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
