# Gorph Deployment Guide

This guide will help you deploy the Gorph infrastructure visualization tool to your Kubernetes cluster using Digital Ocean Container Registry.

## Prerequisites

- Kubernetes cluster with kubectl configured
- Digital Ocean Container Registry (`resourceloop`)
- NGINX Ingress Controller installed
- cert-manager installed (for SSL certificates)
- Let's Encrypt cluster issuer configured

## Quick Deployment

### 1. Setup Configuration

Run the setup script to configure your deployment:

```bash
./k8/setup.sh
```

This will:
- Ask for your domain name
- Update the ingress configuration
- Create the Docker registry secret (if needed)

### 2. Build and Deploy

Build the Docker image and deploy to Kubernetes:

```bash
make k8-deploy
```

This command will:
- Build the WASM backend
- Build the Docker image
- Push to `registry.digitalocean.com/resourceloop/gorph-frontend:latest`
- Deploy to Kubernetes

### 3. Verify Deployment

Check the deployment status:

```bash
make k8-status
```

## Manual Steps

### 1. Get Digital Ocean Registry Token

1. Go to [Digital Ocean Container Registry](https://cloud.digitalocean.com/registry/resourceloop)
2. Navigate to "Settings" → "API"
3. Generate a new token
4. Copy the token for use in the setup

### 2. Configure Domain

Update your DNS to point to your Kubernetes cluster's ingress IP:

```bash
# Get the ingress IP
kubectl get ingress -n gorph gorph-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### 3. Create Registry Secret (if not using setup script)

```bash
kubectl create secret docker-registry do-registry-secret \
  --docker-server=registry.digitalocean.com \
  --docker-username=your-registry-token \
  --docker-password=your-registry-token \
  --docker-email=your-email@example.com \
  --namespace=gorph
```

## Available Commands

### Docker Commands
- `make docker-build` - Build Docker image
- `make docker-push` - Build and push Docker image to registry

### Kubernetes Commands
- `make k8-deploy` - Build, push, and deploy to Kubernetes
- `make k8-apply` - Apply Kubernetes manifests
- `make k8-delete` - Delete Kubernetes resources
- `make k8-status` - Check deployment status
- `make k8-logs` - View application logs

## Architecture

The deployment includes:

- **Namespace**: `gorph` - Isolates the application
- **ConfigMap**: Application configuration
- **Deployment**: 2 replicas with health checks
- **Service**: ClusterIP service for internal communication
- **Ingress**: External access with SSL termination
- **HPA**: Horizontal Pod Autoscaler for automatic scaling

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n gorph
kubectl describe pod <pod-name> -n gorph
```

### View Logs
```bash
make k8-logs
```

### Check Ingress
```bash
kubectl get ingress -n gorph
kubectl describe ingress gorph-ingress -n gorph
```

### Check SSL Certificate
```bash
kubectl get certificate -n gorph
kubectl describe certificate gorph-tls -n gorph
```

### Common Issues

1. **Image Pull Errors**: Ensure the Docker registry secret is created correctly
2. **SSL Certificate Issues**: Verify cert-manager and Let's Encrypt are configured
3. **Ingress Not Working**: Check if NGINX Ingress Controller is installed

## Updates

To update the deployment:

1. Build and push new image:
   ```bash
   make docker-push
   ```

2. Update deployment:
   ```bash
   kubectl rollout restart deployment/gorph-app -n gorph
   ```

3. Monitor rollout:
   ```bash
   kubectl rollout status deployment/gorph-app -n gorph
   ```

## Access

Once deployed, your application will be available at:
`https://your-domain.com`

The application includes:
- YAML input with syntax highlighting
- Template library with 7 pre-built templates
- Real-time validation
- Visual diagram generation
- Mobile-responsive design 