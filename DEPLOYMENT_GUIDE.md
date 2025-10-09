# 🚀 HealthConnect Google Cloud Deployment Guide

## 📋 **Prerequisites**

### **1. Google Cloud Setup**
- **Project ID**: `said-eb2f5`
- **Project Number**: `1026546995867`
- **Region**: `us-central1`

### **2. Required Tools**
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/) (for local testing)
- Git

### **3. Google Cloud APIs to Enable**
- Cloud Build API
- Cloud Run API
- Container Registry API

---

## 🔧 **Quick Deployment**

### **Option 1: Automated Deployment (Recommended)**

#### **Windows:**
```bash
# Run the deployment script
deploy.bat
```

#### **Linux/Mac:**
```bash
# Make script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### **Option 2: Manual Deployment**

#### **Step 1: Authenticate with Google Cloud**
```bash
# Login to Google Cloud
gcloud auth login

# Set the project
gcloud config set project said-eb2f5

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### **Step 2: Deploy using Cloud Build**
```bash
# Submit build and deploy
gcloud builds submit --config=cloudbuild.yaml .
```

#### **Step 3: Get Service URLs**
```bash
# Get backend URL
gcloud run services describe healthconnect-backend --region=us-central1 --format="value(status.url)"

# Get frontend URL
gcloud run services describe healthconnect-frontend --region=us-central1 --format="value(status.url)"
```

---

## 🌐 **Expected Service URLs**

After successful deployment, your services will be available at:

- **Frontend**: `https://healthconnect-frontend-1026546995867-uc.a.run.app`
- **Backend**: `https://healthconnect-backend-1026546995867-uc.a.run.app`

---

## 🧪 **Testing the Deployment**

### **Test Credentials**
- **Patient Account**:
  - Email: `patient.test@healthconnect.com`
  - Password: `password123`

- **Doctor Account**:
  - Email: `doctor.test@healthconnect.com`
  - Password: `password123`

### **Health Check Endpoints**
- **Backend Health**: `https://healthconnect-backend-1026546995867-uc.a.run.app/actuator/health`
- **Frontend Health**: `https://healthconnect-frontend-1026546995867-uc.a.run.app/health`

### **API Testing**
```bash
# Test backend API
curl https://healthconnect-backend-1026546995867-uc.a.run.app/api/health

# Test authentication
curl -X POST https://healthconnect-backend-1026546995867-uc.a.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient.test@healthconnect.com","password":"password123"}'
```

---

## 📊 **Monitoring and Management**

### **View Logs**
```bash
# Backend logs
gcloud run services logs read healthconnect-backend --region=us-central1

# Frontend logs
gcloud run services logs read healthconnect-frontend --region=us-central1

# Follow logs in real-time
gcloud run services logs tail healthconnect-backend --region=us-central1
```

### **View Services**
```bash
# List all Cloud Run services
gcloud run services list --region=us-central1

# Get service details
gcloud run services describe healthconnect-backend --region=us-central1
gcloud run services describe healthconnect-frontend --region=us-central1
```

### **Update Services**
```bash
# Redeploy with new image
gcloud run deploy healthconnect-backend \
  --image gcr.io/said-eb2f5/healthconnect-backend:latest \
  --region us-central1

gcloud run deploy healthconnect-frontend \
  --image gcr.io/said-eb2f5/healthconnect-frontend:latest \
  --region us-central1
```

---

## 🔧 **Configuration**

### **Environment Variables**
The deployment uses the following environment variables:

#### **Backend:**
- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL=jdbc:h2:mem:healthconnect`
- `CORS_ALLOWED_ORIGINS=https://healthconnect-frontend-*-uc.a.run.app`

#### **Frontend:**
- Production environment automatically configured for Cloud Run URLs

### **Resource Allocation**
- **Backend**: 2 CPU, 2Gi memory, max 10 instances
- **Frontend**: 1 CPU, 512Mi memory, max 5 instances

---

## 🛠 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

#### **2. Service Not Responding**
```bash
# Check service status
gcloud run services describe healthconnect-backend --region=us-central1

# Check logs for errors
gcloud run services logs read healthconnect-backend --region=us-central1 --limit=50
```

#### **3. CORS Issues**
- Ensure frontend URL is added to backend CORS configuration
- Check that environment variables are properly set

#### **4. Database Issues**
- H2 database is in-memory and resets on restart
- For persistent data, migrate to Cloud SQL

### **Debugging Commands**
```bash
# Get service configuration
gcloud run services describe healthconnect-backend --region=us-central1 --format=yaml

# Check environment variables
gcloud run services describe healthconnect-backend --region=us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"

# Test connectivity
curl -I https://healthconnect-backend-1026546995867-uc.a.run.app/actuator/health
```

---

## 🔄 **CI/CD Pipeline**

The deployment uses Google Cloud Build with the following stages:

1. **Build Backend Docker Image**
2. **Build Frontend Docker Image**
3. **Push Images to Container Registry**
4. **Deploy Backend to Cloud Run**
5. **Deploy Frontend to Cloud Run**

### **Trigger New Deployment**
```bash
# Trigger manual build
gcloud builds submit --config=cloudbuild.yaml .

# Or commit changes to trigger automatic build (if connected to repository)
git add .
git commit -m "Update deployment"
git push origin main
```

---

## 💰 **Cost Optimization**

### **Current Configuration**
- **Pay-per-use**: Only charged when services are actively handling requests
- **Auto-scaling**: Scales down to 0 when not in use
- **Resource limits**: Configured to prevent unexpected costs

### **Estimated Monthly Costs**
- **Low usage**: $5-15/month
- **Medium usage**: $20-50/month
- **High usage**: $50-100/month

---

## 🔒 **Security Considerations**

### **Current Security Features**
- HTTPS enforced on all endpoints
- JWT token authentication
- CORS properly configured
- Non-root containers
- Health checks enabled

### **Production Recommendations**
1. **Database**: Migrate from H2 to Cloud SQL with encryption
2. **Secrets**: Use Google Secret Manager for sensitive data
3. **SSL**: Custom domain with SSL certificate
4. **IAM**: Proper service account permissions
5. **Monitoring**: Set up Cloud Monitoring and alerting

---

## 📞 **Support**

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review Cloud Build logs
3. Check Cloud Run service logs
4. Verify environment variables and configuration

**Your HealthConnect application is now ready for production on Google Cloud! 🎉**
