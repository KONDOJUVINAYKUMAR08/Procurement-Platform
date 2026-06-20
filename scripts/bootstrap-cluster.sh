#!/usr/bin/env bash
# bootstrap-cluster.sh
# Run once after EKS cluster is provisioned by Terraform.
# This installs the AWS Load Balancer Controller and ArgoCD, then registers
# the App-of-Apps so all application deployments become GitOps-managed.
#
# Prerequisites:
#   - AWS CLI configured and authenticated
#   - kubectl, helm, and argocd CLI installed
#   - terraform outputs available from environments/dev (or prod)
#
# Usage:
#   ./scripts/bootstrap-cluster.sh dev
#   ./scripts/bootstrap-cluster.sh prod

set -euo pipefail

ENV=${1:?Usage: $0 <dev|prod>}
AWS_REGION="us-east-1"

echo "==> Fetching Terraform outputs for $ENV..."
CLUSTER_NAME=$(cd terraform/environments/$ENV && terraform output -raw eks_cluster_name)
LBC_ROLE_ARN=$(cd terraform/environments/$ENV && terraform output -raw eks_lbc_role_arn)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Cluster: $CLUSTER_NAME"
echo "Account: $ACCOUNT_ID"

# 1. Configure kubectl
echo "==> Configuring kubectl..."
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

# 2. Install AWS Load Balancer Controller
echo "==> Installing AWS Load Balancer Controller..."
helm repo add eks https://aws.github.io/eks-charts --force-update
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=true \
  --set "serviceAccount.annotations.eks\.amazonaws\.com/role-arn=${LBC_ROLE_ARN}" \
  --wait

# 3. Install ArgoCD
echo "==> Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
helm repo add argo https://argoproj.github.io/argo-helm --force-update
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --set server.service.type=LoadBalancer \
  --wait

# 4. Apply ArgoCD App-of-Apps
echo "==> Applying ArgoCD App-of-Apps for $ENV..."
kubectl apply -f gitops/applications/environments/$ENV/platform.yaml

echo ""
echo "==> Bootstrap complete!"
echo ""
echo "ArgoCD admin password (login once and change it):"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""
echo "ArgoCD server URL (may take 2-3 mins for LB to provision):"
kubectl -n argocd get svc argocd-server -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"
echo ""
