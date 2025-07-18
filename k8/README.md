# Gorph Kubernetes Deployment

This directory contains all the Kubernetes manifests needed to deploy the Gorph application to your Kubernetes cluster.

## Prerequisites

- Kubernetes cluster with kubectl configured
- Digital Ocean Container Registry
- NGINX Ingress Controller installed
- cert-manager installed (for SSL certificates)
- Let's Encrypt cluster issuer configured

## Quick Start

1. **Run the setup script** to configure your deployment:
   ```bash
   ./k8/setup.sh
   ```

2. **Build and push the Docker image**:
   ```bash
   make docker-push
   ```

3. **Deploy to Kubernetes**:
   ```bash
   make k8-deploy
   ```

4. **Check deployment status**:
   ```bash
   make k8-status
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Configure Docker Registry

The Docker registry is already configured to use:
- **Registry**: `registry.digitalocean.com`
- **Repository**: `resourceloop`
- **Image**: `resourceloop/gorph-frontend`

If you need to change this, update the `Makefile`:
```bash
# Edit Makefile and change:
DOCKER_REPOSITORY=resourceloop
DOCKER_IMAGE=$(DOCKER_REGISTRY)/$(DOCKER_REPOSITORY)/gorph-frontend
```

### 2. Configure Domain

Update `k8/ingress.yaml` with your domain:
```yaml
# Change:
- gorph.yourdomain.com
# to:
- gorph.your-actual-domain.com
```

### 3. Create Docker Registry Secret

```bash
kubectl create secret docker-registry do-registry-secret \
  --docker-server=registry.digitalocean.com \
  --docker-username=your-registry-token \
  --docker-password=your-registry-token \
  --docker-email=your-email@example.com \
  --namespace=gorph
```

**Note**: Replace `your-registry-token` with your Digital Ocean registry token from the `resourceloop` registry.

## Available Make Commands

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

## Resource Requirements

- **CPU**: 100m request, 200m limit per pod
- **Memory**: 128Mi request, 256Mi limit per pod
- **Replicas**: 2 minimum, 10 maximum (auto-scaled)

## Monitoring

### Health Checks
- **Liveness Probe**: HTTP GET `/` every 10 seconds
- **Readiness Probe**: HTTP GET `/` every 5 seconds

### Auto-scaling
- **CPU**: Scales when average utilization > 70%
- **Memory**: Scales when average utilization > 80%

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n gorph
kubectl describe pod <pod-name> -n gorph
```

### View Logs
```bash
make k8-logs
# or
kubectl logs -n gorph -l app=gorph --tail=100 -f
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

## Security

- Non-root user in container
- Resource limits configured
- SSL/TLS termination at ingress
- Docker registry authentication
- Network policies (if needed)

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