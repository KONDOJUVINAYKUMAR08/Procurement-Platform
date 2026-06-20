#!/usr/bin/env bash
# Build each microservice image and push it to Amazon ECR.
#
# Usage:
#   AWS_ACCOUNT_ID=123456789012 AWS_REGION=us-east-1 ./scripts/ecr-push.sh [tag]
#
# - Creates each ECR repo if it doesn't exist.
# - Builds every service image from its own Dockerfile + the frontend image.
# - Tags and pushes to <account>.dkr.ecr.<region>.amazonaws.com/<repo>:<tag>.
#
# Requires: docker, awscli v2, and AWS credentials with ECR permissions.
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
TAG="${1:-latest}"
PREFIX="${ECR_PREFIX:-procurement}"

if [[ -z "${AWS_ACCOUNT_ID:-}" ]]; then
  AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
fi
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# service-name : path-to-Dockerfile  (build context is always the repo root,
# except the frontend which builds from ./frontend).
SERVICES=(
  "identity:backend/services/identity-service/Dockerfile:."
  "finance:backend/services/finance-service/Dockerfile:."
  "procurement:backend/services/procurement-service/Dockerfile:."
  "document:backend/services/document-service/Dockerfile:."
  "ai:backend/services/ai-service/Dockerfile:."
  "frontend:frontend/Dockerfile:frontend"
)

echo "Logging in to ECR ${REGISTRY} ..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${REGISTRY}"

for entry in "${SERVICES[@]}"; do
  IFS=":" read -r name dockerfile context <<< "${entry}"
  repo="${PREFIX}-${name}"
  image="${REGISTRY}/${repo}:${TAG}"

  echo "==> Ensuring ECR repo ${repo} exists"
  aws ecr describe-repositories --repository-names "${repo}" --region "${AWS_REGION}" >/dev/null 2>&1 \
    || aws ecr create-repository --repository-name "${repo}" --region "${AWS_REGION}" \
         --image-scanning-configuration scanOnPush=true >/dev/null

  echo "==> Building ${image} (dockerfile=${dockerfile}, context=${context})"
  docker build -f "${dockerfile}" -t "${image}" "${context}"

  echo "==> Pushing ${image}"
  docker push "${image}"
done

echo "Done. Pushed tag '${TAG}' for: identity finance procurement document ai frontend"
