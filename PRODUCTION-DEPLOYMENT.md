# HealthConnect - Production Deployment Guide

## Overview
This guide covers deploying the HealthConnect telemedicine platform to production with Docker and PostgreSQL.

## Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM and 20GB disk space
- Domain name (for SSL/HTTPS)
- SSL certificates (Let's Encrypt recommended)

## Quick Start

### 1. Environment Setup
Create a `.env` file in the project root:

```bash
# Database Configuration
POSTGRES_DB=healthconnect
POSTGRES_USER=healthconnect_user
POSTGRES_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here

# Google AI Configuration (Optional)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload Directory
FILE_UPLOAD_DIR=/var/healthconnect/uploads

# SSL Configuration (if using HTTPS)
SSL_KEYSTORE_PASSWORD=your_ssl_keystore_password
```

### 2. Deploy with Docker Compose
```bash
# Clone the repository
git clone <repository-url>
cd healthconnect

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Initial Setup
The application will automatically:
- Create database tables
- Initialize test accounts
- Set up default configurations

## Production Configuration

### Database
- **PostgreSQL 15** with persistent storage
- Automatic backups recommended
- Connection pooling configured
- Performance optimizations applied

### Security Features
- JWT-based authentication
- CORS protection
- SQL injection prevention
- XSS protection headers
- HTTPS support (configure SSL)

### Monitoring & Health Checks
- Health check endpoints: `/actuator/health`
- Application metrics available
- Docker health checks configured
- Log aggregation ready

## Test Accounts
Default test accounts are created automatically:

**Patient Account:**
- Email: `patient.test@healthconnect.com`
- Password: `password123`

**Doctor Account:**
- Email: `doctor.test@healthconnect.com`
- Password: `password123`

**Additional Doctor:**
- Email: `doctor2.test@healthconnect.com`
- Password: `password123`

## Features Verified ✅

### Core Functionality
- ✅ User registration (patients and doctors)
- ✅ Authentication and authorization
- ✅ Role-based access control
- ✅ Appointment booking (patients only)
- ✅ Doctor dashboard with appointments
- ✅ Real-time chat between patients and doctors
- ✅ Video consultation creation and management
- ✅ WebRTC video calling infrastructure

### API Endpoints
- ✅ `/api/auth/register` - User registration
- ✅ `/api/auth/login` - User authentication
- ✅ `/api/appointments` - Appointment management
- ✅ `/api/chats` - Chat functionality
- ✅ `/api/video-consultation` - Video consultation management
- ✅ `/api/users/doctors` - Doctor discovery
- ✅ `/api/users/patients` - Patient management

### Real-time Features
- ✅ WebSocket connections for chat
- ✅ WebRTC signaling for video calls
- ✅ User presence tracking
- ✅ Typing indicators

## Scaling Considerations

### Horizontal Scaling
- Frontend: Multiple Nginx instances behind load balancer
- Backend: Multiple Spring Boot instances with shared database
- Database: PostgreSQL with read replicas

### Performance Optimizations
- Redis for session management and caching
- CDN for static assets
- Database connection pooling
- Gzip compression enabled

## Backup Strategy
```bash
# Database backup
docker exec healthconnect-postgres pg_dump -U healthconnect_user healthconnect > backup.sql

# Restore database
docker exec -i healthconnect-postgres psql -U healthconnect_user healthconnect < backup.sql
```

## SSL/HTTPS Setup
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update nginx configuration with SSL settings
3. Redirect HTTP to HTTPS
4. Update CORS origins to use HTTPS

## Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check PostgreSQL container status
   - Verify database credentials
   - Ensure network connectivity

2. **Frontend Not Loading**
   - Check Nginx container status
   - Verify API proxy configuration
   - Check CORS settings

3. **WebSocket Connection Failed**
   - Verify WebSocket proxy configuration
   - Check firewall settings
   - Ensure proper headers are set

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## Support
For issues and support, please check:
1. Application logs
2. Database connectivity
3. Network configuration
4. Environment variables

## Security Checklist
- [ ] Change default passwords
- [ ] Configure SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure monitoring
- [ ] Update CORS origins
- [ ] Set secure JWT secret
- [ ] Enable rate limiting (if needed)
