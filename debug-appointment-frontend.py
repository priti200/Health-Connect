#!/usr/bin/env python3
"""
Debug appointment booking frontend issues
"""

import requests
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
import time

def test_frontend_appointment_booking():
    """Test appointment booking through the frontend"""
    print("🔄 Testing Frontend Appointment Booking...")
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("http://localhost:4200")
        
        print("✅ Opened frontend application")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Check if login page is loaded
        if "login" in driver.current_url.lower() or driver.find_elements(By.CSS_SELECTOR, "input[type='email']"):
            print("📝 Login page detected, logging in...")
            
            # Fill login form
            email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
            password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            
            email_input.send_keys("patient.test@healthconnect.com")
            password_input.send_keys("password123")
            
            # Submit login
            login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            # Wait for redirect
            WebDriverWait(driver, 10).until(
                lambda d: "login" not in d.current_url.lower()
            )
            print("✅ Login successful")
        
        # Navigate to appointment booking
        print("🔄 Navigating to appointment booking...")
        driver.get("http://localhost:4200/appointments/book")
        
        # Wait for form to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "form"))
        )
        
        print("✅ Appointment booking form loaded")
        
        # Check for any JavaScript errors
        logs = driver.get_log('browser')
        if logs:
            print("⚠️  Browser console errors:")
            for log in logs:
                if log['level'] == 'SEVERE':
                    print(f"   ERROR: {log['message']}")
                elif log['level'] == 'WARNING':
                    print(f"   WARNING: {log['message']}")
        
        # Check if doctors are loaded
        doctor_select = driver.find_element(By.CSS_SELECTOR, "select[formControlName='doctorId']")
        options = doctor_select.find_elements(By.TAG_NAME, "option")
        
        if len(options) > 1:  # More than just the placeholder
            print(f"✅ Found {len(options) - 1} doctors in dropdown")
            
            # Select first doctor
            select = Select(doctor_select)
            select.select_by_index(1)  # Select first actual doctor
            print("✅ Doctor selected")
            
            # Wait for time slots to load
            time.sleep(2)
            
            # Check if time slots are available
            time_slots = driver.find_elements(By.CSS_SELECTOR, "input[name='timeSlot']")
            if time_slots:
                print(f"✅ Found {len(time_slots)} time slots")
                
                # Select first available time slot
                time_slots[0].click()
                print("✅ Time slot selected")
                
                # Fill reason for visit
                reason_input = driver.find_element(By.CSS_SELECTOR, "input[formControlName='reasonForVisit']")
                reason_input.send_keys("Test appointment from automated test")
                print("✅ Reason for visit filled")
                
                # Submit form
                submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                if submit_button.is_enabled():
                    print("🔄 Submitting appointment booking form...")
                    submit_button.click()
                    
                    # Wait for response
                    time.sleep(3)
                    
                    # Check for success or error messages
                    success_elements = driver.find_elements(By.CSS_SELECTOR, ".alert-success, .text-success")
                    error_elements = driver.find_elements(By.CSS_SELECTOR, ".alert-danger, .text-danger")
                    
                    if success_elements:
                        print("✅ SUCCESS: Appointment booking successful!")
                        for elem in success_elements:
                            if elem.text:
                                print(f"   Message: {elem.text}")
                        return True
                    elif error_elements:
                        print("❌ ERROR: Appointment booking failed!")
                        for elem in error_elements:
                            if elem.text:
                                print(f"   Error: {elem.text}")
                        return False
                    else:
                        print("⚠️  No clear success/error message found")
                        
                        # Check if we were redirected (success case)
                        if "appointments" in driver.current_url and "book" not in driver.current_url:
                            print("✅ Redirected to appointments page - likely successful")
                            return True
                        else:
                            print("❌ Still on booking page - likely failed")
                            return False
                else:
                    print("❌ Submit button is disabled")
                    return False
            else:
                print("❌ No time slots found")
                return False
        else:
            print("❌ No doctors found in dropdown")
            return False
            
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False
    finally:
        try:
            driver.quit()
        except:
            pass

def test_api_directly():
    """Test the API directly to confirm it works"""
    print("\n🔄 Testing API directly...")
    
    # Login
    login_resp = requests.post('http://localhost:8080/api/auth/login', 
        json={'email': 'patient.test@healthconnect.com', 'password': 'password123'})
    
    if login_resp.status_code == 200:
        patient_data = login_resp.json()
        patient_token = patient_data['token']
        
        # Book appointment
        appointment_data = {
            'doctorId': 2,  # Known doctor ID
            'date': '2025-06-10',
            'startTime': '10:00',
            'endTime': '10:30',
            'type': 'IN_PERSON',
            'reasonForVisit': 'API test appointment'
        }
        
        book_resp = requests.post('http://localhost:8080/api/appointments',
            json=appointment_data,
            headers={'Authorization': f'Bearer {patient_token}', 'Content-Type': 'application/json'})
        
        if book_resp.status_code in [200, 201]:
            print("✅ API booking successful")
            return True
        else:
            print(f"❌ API booking failed: {book_resp.status_code}")
            return False
    else:
        print("❌ API login failed")
        return False

def main():
    print("🧪 Debugging Appointment Booking Issues")
    print("=" * 60)
    
    # Test API first
    api_ok = test_api_directly()
    
    # Test frontend if selenium is available
    frontend_ok = False
    try:
        frontend_ok = test_frontend_appointment_booking()
    except ImportError:
        print("⚠️  Selenium not available, skipping frontend test")
        print("   Install with: pip install selenium")
    except Exception as e:
        print(f"⚠️  Frontend test skipped: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 APPOINTMENT BOOKING DEBUG SUMMARY")
    print("=" * 60)
    print(f"{'✅' if api_ok else '❌'} API Direct Test: {'PASS' if api_ok else 'FAIL'}")
    print(f"{'✅' if frontend_ok else '❌'} Frontend Test: {'PASS' if frontend_ok else 'FAIL'}")
    
    if api_ok and not frontend_ok:
        print("\n🔍 DIAGNOSIS: Frontend issue detected!")
        print("   • API works correctly")
        print("   • Frontend has a bug")
        print("   • Check browser console for JavaScript errors")
        print("   • Verify form validation logic")
        print("   • Check authentication token handling")
    elif api_ok and frontend_ok:
        print("\n✅ DIAGNOSIS: Everything working correctly!")
    else:
        print("\n❌ DIAGNOSIS: API issues detected!")

if __name__ == "__main__":
    main()
