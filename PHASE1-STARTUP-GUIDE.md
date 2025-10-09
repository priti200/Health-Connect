# 🚀 Phase 1 Startup Guide - HealthConnect

## ✅ Phase 1 Complete: User Management & Authentication

Phase 1 has been successfully implemented with the following features:

### 🎯 Implemented Features
- ✅ **User Registration**: Separate registration for Patients and Doctors with role-specific fields
- ✅ **Authentication**: JWT-based login/logout with secure token management
- ✅ **Role-based Access**: Different dashboards and permissions for Doctors vs Patients
- ✅ **Profile Management**: Update user profiles with validation
- ✅ **Responsive UI**: Bootstrap-styled interface that works on all devices
- ✅ **Security**: Protected routes, authentication guards, and secure API endpoints

## 🏃‍♂️ Quick Start Instructions

### Prerequisites Check
Ensure you have the following installed:
- ☑️ Java 17 or higher
- ☑️ Node.js 18 or higher
- ☑️ Python 3.7+ (for testing)

### Step 1: Navigate to Project Directory
```bash
cd FullStackProject/HealthConnect-Integrated
```

### Step 2: Start the Application
```bash
# Option A: Start everything at once (Recommended)
./start-all.sh

# Option B: Start services individually
# Terminal 1 - Backend
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

### Step 3: Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **Database Console**: http://localhost:8080/h2-console

### Step 4: Test the Application

#### Manual Testing
1. **Registration Test**:
   - Go to http://localhost:4200
   - Click "Sign up here"
   - Register as both Doctor and Patient
   - Verify role-specific fields appear for doctors

2. **Login Test**:
   - Login with created accounts
   - Verify different dashboards for each role
   - Test logout functionality

3. **Profile Management**:
   - Navigate to profile settings
   - Update profile information
   - Verify changes are saved

#### Automated Testing
```bash
# Run comprehensive integration tests
python3 integration-tests/phase1-auth-test.py
```

## 🧪 Test Accounts

The system automatically creates these test accounts:

### Doctor Account
- **Email**: `doctor.test@healthconnect.com`
- **Password**: `password123`
- **Specialization**: Cardiology
- **License**: DOC123456789

### Patient Account
- **Email**: `patient.test@healthconnect.com`
- **Password**: `password123`

## 🔍 Verification Checklist

Before proceeding to Phase 2, verify these work:

- [ ] Backend starts successfully on port 8080
- [ ] Frontend starts successfully on port 4200
- [ ] Doctor registration with specialization fields
- [ ] Patient registration with basic fields
- [ ] Login redirects to appropriate dashboard
- [ ] Doctor dashboard shows professional interface
- [ ] Patient dashboard shows health-focused interface
- [ ] Profile updates work correctly
- [ ] Logout clears authentication
- [ ] Protected routes require authentication
- [ ] Integration tests pass

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check Java version
java -version

# Check if port 8080 is free
lsof -i :8080

# View backend logs
cd backend && ./mvnw spring-boot:run
```

### Frontend Issues
```bash
# Check Node.js version
node -v

# Check if port 4200 is free
lsof -i :4200

# Clear npm cache
cd frontend && npm cache clean --force && npm install
```

### Database Issues
- Access H2 Console: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:healthconnect`
- Username: `sa`
- Password: `password`

## 🎉 Success Criteria

Phase 1 is complete when:
1. ✅ All services start without errors
2. ✅ User registration works for both roles
3. ✅ Authentication and authorization work correctly
4. ✅ Role-based dashboards display properly
5. ✅ Profile management functions correctly
6. ✅ Integration tests pass with 100% success rate

## 🚀 Next Steps

Once Phase 1 is verified working:
1. **Phase 2**: Appointment Management System
   - Doctor discovery and profiles
   - Appointment booking and scheduling
   - Calendar interface
   - Appointment CRUD operations

---

**Need Help?** 
- Check the main README.md for detailed documentation
- Review the integration test output for specific issues
- Ensure all prerequisites are properly installed
