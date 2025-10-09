#!/usr/bin/env python3
"""
Test WebSocket real-time messaging functionality
"""

import requests
import json
import websocket
import threading
import time
from datetime import datetime

def test_websocket_connection():
    """Test WebSocket connection and real-time messaging"""
    print("🔄 Testing WebSocket Real-time Messaging...")
    
    # First, create test accounts and chat
    print("Setting up test data...")
    
    # Login as patient
    patient_login = requests.post('http://localhost:8080/api/auth/login', 
        json={'email': 'patient.test@healthconnect.com', 'password': 'password123'})
    
    if patient_login.status_code != 200:
        print("❌ Patient login failed")
        return False
    
    patient_data = patient_login.json()
    patient_token = patient_data['token']
    
    # Login as doctor
    doctor_login = requests.post('http://localhost:8080/api/auth/login', 
        json={'email': 'doctor.test@healthconnect.com', 'password': 'password123'})
    
    if doctor_login.status_code != 200:
        print("❌ Doctor login failed")
        return False
    
    doctor_data = doctor_login.json()
    doctor_token = doctor_data['token']
    # Handle different response formats
    if 'user' in doctor_data:
        doctor_id = doctor_data['user']['id']
    else:
        doctor_id = doctor_data['id']
    
    # Get or create chat
    chat_resp = requests.post('http://localhost:8080/api/chats',
        json={'participantId': doctor_id},
        headers={'Authorization': f'Bearer {patient_token}', 'Content-Type': 'application/json'})
    
    if chat_resp.status_code not in [200, 201]:
        print("❌ Chat creation failed")
        return False
    
    chat = chat_resp.json()
    chat_id = chat['id']
    print(f"✅ Using chat ID: {chat_id}")
    
    # Test WebSocket connection
    messages_received = []
    connection_successful = False
    
    def on_message(ws, message):
        print(f"📨 WebSocket message received: {message}")
        messages_received.append(json.loads(message))
    
    def on_error(ws, error):
        print(f"❌ WebSocket error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("🔌 WebSocket connection closed")
    
    def on_open(ws):
        nonlocal connection_successful
        connection_successful = True
        print("✅ WebSocket connection established")
        
        # Subscribe to chat topic
        subscribe_msg = {
            "id": "sub-1",
            "destination": f"/topic/chat/{chat_id}",
            "headers": {
                "Authorization": f"Bearer {patient_token}"
            }
        }
        ws.send(json.dumps(subscribe_msg))
        print(f"📡 Subscribed to chat topic: /topic/chat/{chat_id}")
    
    try:
        # Connect to WebSocket
        ws_url = f"ws://localhost:8080/ws"
        ws = websocket.WebSocketApp(ws_url,
                                  on_open=on_open,
                                  on_message=on_message,
                                  on_error=on_error,
                                  on_close=on_close)
        
        # Start WebSocket in a separate thread
        ws_thread = threading.Thread(target=ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
        
        # Wait for connection
        time.sleep(2)
        
        if not connection_successful:
            print("❌ WebSocket connection failed")
            return False
        
        # Send a message via REST API (this should trigger WebSocket notification)
        test_message = f"Test message sent at {datetime.now().strftime('%H:%M:%S')}"
        msg_resp = requests.post(f'http://localhost:8080/api/chats/{chat_id}/messages',
            json={'content': test_message},
            headers={'Authorization': f'Bearer {doctor_token}', 'Content-Type': 'application/json'})
        
        if msg_resp.status_code in [200, 201]:
            print("✅ Message sent via REST API")
            
            # Wait for WebSocket message
            time.sleep(3)
            
            if messages_received:
                print(f"✅ Real-time message received via WebSocket!")
                print(f"   Content: {messages_received[-1].get('content', 'N/A')}")
                return True
            else:
                print("⚠️  No WebSocket messages received")
                return False
        else:
            print(f"❌ Message sending failed: {msg_resp.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")
        return False
    finally:
        try:
            ws.close()
        except:
            pass

def test_frontend_chat_routes():
    """Test if chat routes are accessible"""
    print("\n🔄 Testing Frontend Chat Routes...")
    
    try:
        # Test main chat route
        response = requests.get('http://localhost:4200/chat')
        if response.status_code == 200:
            print("✅ Chat route accessible")
            return True
        else:
            print(f"❌ Chat route failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend route test error: {e}")
        return False

def main():
    print("🧪 Testing WebSocket & Frontend Integration")
    print("=" * 60)
    
    # Test WebSocket functionality
    websocket_ok = test_websocket_connection()
    
    # Test frontend routes
    frontend_ok = test_frontend_chat_routes()
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 WEBSOCKET & FRONTEND TEST SUMMARY")
    print("=" * 60)
    print(f"{'✅' if websocket_ok else '❌'} WebSocket Real-time Messaging: {'PASS' if websocket_ok else 'FAIL'}")
    print(f"{'✅' if frontend_ok else '❌'} Frontend Chat Routes: {'PASS' if frontend_ok else 'FAIL'}")
    
    if websocket_ok and frontend_ok:
        print("\n🎉 ALL WEBSOCKET & FRONTEND TESTS PASSED!")
        print("\n📱 Ready for manual testing:")
        print("   1. Open http://localhost:4200")
        print("   2. Login as patient: patient.test@healthconnect.com / password123")
        print("   3. Navigate to Messages/Chat")
        print("   4. Open another browser (incognito)")
        print("   5. Login as doctor: doctor.test@healthconnect.com / password123")
        print("   6. Navigate to Messages/Chat")
        print("   7. Send messages between patient and doctor")
        print("   8. Verify real-time delivery without page refresh")
    else:
        print("\n⚠️  Some WebSocket/Frontend tests failed.")

if __name__ == "__main__":
    main()
