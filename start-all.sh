#!/bin/bash

# HealthConnect Full Stack Startup Script

echo "🏥 HealthConnect - Integrated Medical Platform"
echo "=============================================="
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check if required ports are available
echo "🔍 Checking port availability..."
check_port 8080 || exit 1
check_port 4200 || exit 1

echo "✅ Ports are available"
echo ""

# Start backend in background
echo "🚀 Starting Backend (Spring Boot)..."
cd backend
chmod +x ../start-backend.sh
../start-backend.sh &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check if backend is running
if ! curl -s http://localhost:8080/api/test/health > /dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running at http://localhost:8080"
echo ""

# Start frontend in background
echo "🚀 Starting Frontend (Angular)..."
cd ../frontend
chmod +x ../start-frontend.sh
../start-frontend.sh &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 15

echo ""
echo "🎉 HealthConnect is now running!"
echo "================================"
echo "🌐 Frontend: http://localhost:4200"
echo "🔧 Backend:  http://localhost:8080"
echo "🗄️  Database: http://localhost:8080/h2-console"
echo ""
echo "📋 Test Credentials:"
echo "   Doctor:  doctor.test@healthconnect.com / password123"
echo "   Patient: patient.test@healthconnect.com / password123"
echo ""
echo "🧪 To run integration tests:"
echo "   python3 integration-tests/phase1-auth-test.py"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping HealthConnect services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
