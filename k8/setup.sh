#!/bin/bash

# Gorph Kubernetes Setup Script
# This script helps set up the Kubernetes deployment for Gorph

set -e

echo "🚀 Gorph Kubernetes Setup"
echo "=========================="

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured. Please configure kubectl to connect to your cluster."
    exit 1
fi

echo "✅ kubectl is configured"

# Get user input for configuration
echo ""
echo "Please provide the following information:"
echo ""

# Domain
read -p "Enter your domain for the application (e.g., gorph.mydomain.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required"
    exit 1
fi

# Update ingress with domain
echo "📝 Updating ingress configuration..."
sed -i.bak "s/gorph.yourdomain.com/$DOMAIN/g" k8/ingress.yaml
rm -f k8/ingress.yaml.bak

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Build and push the Docker image:"
echo "   make docker-push"
echo ""
echo "2. Deploy to Kubernetes:"
echo "   make k8-deploy"
echo ""
echo "3. Check deployment status:"
echo "   make k8-status"
echo ""
echo "4. View logs:"
echo "   make k8-logs"
echo ""
echo "Your application will be available at: https://$DOMAIN" 