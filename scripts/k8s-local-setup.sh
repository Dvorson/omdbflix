#!/bin/bash

# Exit on error
set -e

echo "🔧 Setting up local Kubernetes development environment using Kustomize..."

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube is not installed. Please install it first:"
    echo "   https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first:"
    echo "   https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if kustomize is installed
if ! command -v kustomize &> /dev/null; then
    echo "❌ kustomize is not installed. Please install it first:"
    echo "   https://kubectl.docs.kubernetes.io/installation/kustomize/"
    exit 1
fi

# Start minikube if it's not running
if ! minikube status | grep -q "Running"; then
    echo "🚀 Starting Minikube..."
    minikube start
fi

# Set docker env to use minikube's docker daemon
echo "🔄 Configuring Docker environment..."
eval $(minikube docker-env)

# Build the Docker images
echo "🏗️  Building Docker images..."
echo "🏗️  Building frontend image..."
docker build -t movie-explorer-frontend:latest -f frontend/Dockerfile .
echo "🏗️  Building backend image..."
docker build -t movie-explorer-api:latest -f backend/Dockerfile .

# Apply Kubernetes manifests using Kustomize
echo "📦 Deploying to Kubernetes using Kustomize overlay 'local'..."
kustomize build k8s/overlays/local | kubectl apply -f -

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --namespace movie-explorer --for=condition=available --timeout=300s deployment/frontend-deployment
kubectl wait --namespace movie-explorer --for=condition=available --timeout=300s deployment/backend-deployment

# Get the URL
echo "🌐 Getting application URL..."
MINIKUBE_IP=$(minikube ip)
FRONTEND_PORT=$(kubectl get svc frontend-service -n movie-explorer -o jsonpath='{.spec.ports[0].nodePort}')
echo "✅ Application should be running!"
echo "📝 Access the application at: http://$MINIKUBE_IP:$FRONTEND_PORT"

# Show pods status
echo "📊 Pod status:"
kubectl get pods -n movie-explorer

echo "
🔍 Useful commands:
   • View frontend logs: kubectl logs -n movie-explorer -l app=frontend
   • View backend logs: kubectl logs -n movie-explorer -l app=backend
   • Shell into frontend pod: kubectl exec -n movie-explorer -it \$(kubectl get pod -n movie-explorer -l app=frontend -o jsonpath='{.items[0].metadata.name}') -- /bin/sh
   • Shell into backend pod: kubectl exec -n movie-explorer -it \$(kubectl get pod -n movie-explorer -l app=backend -o jsonpath='{.items[0].metadata.name}') -- /bin/sh
   • Describe frontend service: kubectl describe svc frontend-service -n movie-explorer
   • Stop cluster: minikube stop
   • Delete cluster: minikube delete
" 