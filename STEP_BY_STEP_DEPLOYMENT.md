# 🚀 Step-by-Step Deployment Guide: Backend First, Then Frontend

## 📋 **Overview**

This guide will help you deploy HealthConnect to Google Cloud in the correct order:
1. **Backend + Database** (Spring Boot with H2)
2. **Frontend** (Angular with Nginx)

---

## 🔧 **Prerequisites**

### **1. Google Cloud Setup**
- **Project ID**: `said-eb2f5`
- **Project Number**: `1026546995867`
- **Region**: `us-central1`

### **2. Required Tools**
```bash
# Install Google Cloud CLI
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Mac: brew install google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash

# Verify installation
gcloud --version
```

### **3. Authentication**
```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project said-eb2f5

# Verify authentication
gcloud auth list
```

---

## 🏗️ **STEP 1: Deploy Backend + Database**

### **Windows:**
```cmd
# Deploy backend first
deploy-backend.bat
```

### **Linux/Mac:**
```bash
# Make script executable
chmod +x deploy-backend.sh

# Deploy backend first
./deploy-backend.sh
```

### **Manual Backend Deployment:**
```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Deploy backend only
gcloud builds submit --config=deploy-backend.yaml .

# Get backend URL
gcloud run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"
```

### **Expected Backend URL:**
```
https://healthconnect-backend-1026546995867-uc.a.run.app
```

### **Test Backend Deployment:**
```bash
# Test health endpoint
curl https://healthconnect-backend-1026546995867-uc.a.run.app/actuator/health

# Test API endpoint
curl https://healthconnect-backend-1026546995867-uc.a.run.app/api/health

# Test authentication
curl -X POST https://healthconnect-backend-1026546995867-uc.a.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient.test@healthconnect.com","password":"password123"}'
```

---

## 🎨 **STEP 2: Deploy Frontend**

**⚠️ Important: Only proceed after backend is successfully deployed and tested!**

### **Windows:**
```cmd
# Deploy frontend (after backend is ready)
deploy-frontend.bat
```

### **Linux/Mac:**
```bash
# Make script executable
chmod +x deploy-frontend.sh

# Deploy frontend (after backend is ready)
./deploy-frontend.sh
```

### **Manual Frontend Deployment:**
```bash
# Deploy frontend only
gcloud builds submit --config=deploy-frontend.yaml .

# Get frontend URL
gcloud run services describe healthconnect-frontend --region=us-central1 --format="value(status.url)"

# Update backend CORS with frontend URL
FRONTEND_URL=$(gcloud run services describe healthconnect-frontend --region=us-central1 --format="value(status.url)")
gcloud run services update healthconnect-backend --region=us-central1 --update-env-vars="CORS_ALLOWED_ORIGINS=$FRONTEND_URL,https://*.run.app"
```

### **Expected Frontend URL:**
```
https://healthconnect-frontend-1026546995867-uc.a.run.app
```

---

## 🧪 **STEP 3: Test Complete Deployment**

### **Service URLs:**
- **Frontend**: `https://healthconnect-frontend-1026546995867-uc.a.run.app`
- **Backend**: `https://healthconnect-backend-1026546995867-uc.a.run.app`

### **Test Credentials:**
- **Patient Account**:
  - Email: `patient.test@healthconnect.com`
  - Password: `password123`

- **Doctor Account**:
  - Email: `doctor.test@healthconnect.com`
  - Password: `password123`

### **Health Check Endpoints:**
```bash
# Frontend health
curl https://healthconnect-frontend-1026546995867-uc.a.run.app/health

# Backend health
curl https://healthconnect-backend-1026546995867-uc.a.run.app/actuator/health

# Backend API
curl https://healthconnect-backend-1026546995867-uc.a.run.app/api/health
```

### **Functional Testing:**
1. **Open Frontend URL** in browser
2. **Login** with test credentials
3. **Test Patient Dashboard** - Enhanced UI with all features
4. **Test Doctor Dashboard** - Professional medical interface
5. **Test Prescription Analyzer** - Upload prescription image
6. **Test Video Calls** - Agora integration
7. **Test Chat** - Real-time messaging
8. **Test Appointments** - Booking and management

---

## 📊 **Monitoring and Logs**

### **View Deployment Status:**
```bash
# List all services
gcloud run services list --region=us-central1

# Check service details
gcloud run services describe healthconnect-backend --region=us-central1
gcloud run services describe healthconnect-frontend --region=us-central1
```

### **View Logs:**
```bash
# Backend logs
gcloud run services logs read healthconnect-backend --region=us-central1

# Frontend logs
gcloud run services logs read healthconnect-frontend --region=us-central1

# Follow logs in real-time
gcloud run services logs tail healthconnect-backend --region=us-central1
```

### **Build Logs:**
```bash
# List recent builds
gcloud builds list --limit=5

# View specific build log
gcloud builds log [BUILD_ID]
```

---

## 🔧 **Troubleshooting**

### **Backend Issues:**
```bash
# Check backend service status
gcloud run services describe healthconnect-backend --region=us-central1

# Check backend logs for errors
gcloud run services logs read healthconnect-backend --region=us-central1 --limit=50

# Test backend connectivity
curl -I https://healthconnect-backend-1026546995867-uc.a.run.app/actuator/health
```

### **Frontend Issues:**
```bash
# Check frontend service status
gcloud run services describe healthconnect-frontend --region=us-central1

# Check frontend logs
gcloud run services logs read healthconnect-frontend --region=us-central1 --limit=50

# Test frontend connectivity
curl -I https://healthconnect-frontend-1026546995867-uc.a.run.app/health
```

### **CORS Issues:**
```bash
# Update CORS configuration
FRONTEND_URL=$(gcloud run services describe healthconnect-frontend --region=us-central1 --format="value(status.url)")
gcloud run services update healthconnect-backend --region=us-central1 --update-env-vars="CORS_ALLOWED_ORIGINS=$FRONTEND_URL,https://*.run.app"
```

### **Build Issues:**
```bash
# Check build status
gcloud builds list --filter="status=FAILURE" --limit=5

# View failed build details
gcloud builds log [FAILED_BUILD_ID]
```

---

## 🔄 **Update Deployments**

### **Update Backend:**
```bash
# Redeploy backend with latest changes
gcloud builds submit --config=deploy-backend.yaml .
```

### **Update Frontend:**
```bash
# Redeploy frontend with latest changes
gcloud builds submit --config=deploy-frontend.yaml .
```

### **Update Both:**
```bash
# Deploy backend first, then frontend
./deploy-backend.sh
./deploy-frontend.sh
```

---

## 💰 **Cost Information**

### **Resource Allocation:**
- **Backend**: 2 CPU, 2Gi memory, max 10 instances
- **Frontend**: 1 CPU, 512Mi memory, max 5 instances

### **Estimated Costs:**
- **Idle**: $0 (auto-scales to zero)
- **Low usage**: $5-15/month
- **Medium usage**: $20-50/month

---

## 🎯 **Next Steps After Deployment**

1. **Verify all functionality** works correctly
2. **Test with real users** using the test credentials
3. **Monitor performance** and logs
4. **Set up custom domain** (optional)
5. **Configure Cloud SQL** for persistent database (optional)
6. **Set up monitoring alerts** (optional)

---

## 📞 **Support**

If you encounter issues:

1. **Check logs** using the commands above
2. **Verify authentication** with `gcloud auth list`
3. **Check project permissions** for `said-eb2f5`
4. **Review build logs** for deployment failures
5. **Test connectivity** using curl commands

**Your HealthConnect application will be live on Google Cloud after following these steps! 🎉**
