#!/bin/bash

# HealthConnect Google Cloud Deployment Script
# Project ID: said-eb2f5

set -e

echo "🚀 Starting HealthConnect deployment to Google Cloud..."

# Configuration
PROJECT_ID="said-eb2f5"
REGION="us-central1"
BACKEND_SERVICE="healthconnect-backend"
FRONTEND_SERVICE="healthconnect-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "You are not authenticated with gcloud. Please run 'gcloud auth login'"
    exit 1
fi

# Set the project
print_status "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
print_status "Starting Cloud Build deployment..."
gcloud builds submit --config=cloudbuild.yaml .

# Get service URLs
print_status "Getting service URLs..."
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")

print_success "Deployment completed successfully!"
echo ""
echo "🌐 Service URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "📋 Test Credentials:"
echo "   Patient: patient.test@healthconnect.com / password123"
echo "   Doctor:  doctor.test@healthconnect.com / password123"
echo ""
echo "🔧 To view logs:"
echo "   Backend:  gcloud run services logs read $BACKEND_SERVICE --region=$REGION"
echo "   Frontend: gcloud run services logs read $FRONTEND_SERVICE --region=$REGION"
echo ""
echo "📊 To view services:"
echo "   gcloud run services list --region=$REGION"
echo ""
print_success "HealthConnect is now live on Google Cloud! 🎉"
