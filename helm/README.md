# Helm Charts — ProcureFlow

**Author:** Vinay Kumar Kondoju

This directory contains the Helm chart that deploys the full ProcureFlow Procurement Platform onto the EKS cluster. It is structured as an umbrella chart with one sub-chart per service.

---

## Chart Structure

```
helm/procurement-platform/
├── Chart.yaml              ← Umbrella chart (lists 6 sub-chart dependencies)
├── values.yaml             ← Base values — image placeholders, resource defaults
├── values-dev.yaml         ← Dev overrides — written by the CD pipeline (image tags, IRSA ARNs, ACM ARN)
├── values-prod.yaml        ← Prod overrides — same structure, production values
└── charts/
    ├── frontend/           ← React + nginx static SPA
    ├── identity-service/   ← Auth, users, HR (port 5001)
    ├── procurement-service/ ← Vendors, POs, PRs, contracts (port 5003)
    ├── finance-service/    ← Invoices, payments, customers (port 5002)
    ├── document-service/   ← Documents, audit logs, notifications (port 5004)
    └── ai-service/         ← Bedrock AI features (port 5006)
```

---

## How It Works

### Umbrella Chart Pattern

`Chart.yaml` declares all 6 services as local file dependencies:

```yaml
dependencies:
  - name: frontend
    version: 0.1.0
    repository: "file://charts/frontend"
  - name: identity-service
    ...
```

Running `helm dependency update` packages each sub-chart into the parent. ArgoCD then syncs the parent chart against the cluster.

### Per-Sub-Chart Resources

Each sub-chart creates:

| Resource | Purpose |
|----------|---------|
| `Deployment` | Runs the service container, mounts the Secrets Manager sidecar init |
| `Service` (ClusterIP) | Internal cluster endpoint for the Deployment |
| `ServiceAccount` | Kubernetes SA with the IRSA annotation (`eks.amazonaws.com/role-arn`) |
| `Ingress` contribution | Path rules added to the shared ALB Ingress via annotations |

### ALB Ingress

There is a single ALB for the entire platform. The AWS Load Balancer Controller (running in-cluster) reads Ingress annotations from each sub-chart and programs all path rules into one internet-facing ALB. Path-based routing:

| Path Prefix | Routed To |
|------------|----------|
| `/` | `frontend` |
| `/api/auth`, `/api/users`, `/api/hr` | `identity-service` |
| `/api/vendors`, `/api/purchase-*`, `/api/contracts` | `procurement-service` |
| `/api/invoices`, `/api/payments`, `/api/customers` | `finance-service` |
| `/api/documents`, `/api/notifications`, `/api/audit` | `document-service` |
| `/api/ai` | `ai-service` |

HTTPS is terminated at the ALB using the ACM certificate ARN injected by the CD pipeline into `values-dev.yaml`.

---

## Values Files

### `values.yaml` — Base

Defines the skeleton structure and sane defaults (resource requests/limits, replica count, liveness/readiness probe paths). Image repository and tag are set to placeholder strings that the CD pipeline overwrites.

### `values-dev.yaml` — Automatically Updated by CD

The `cd-dev.yml` GitHub Actions workflow rewrites this file on every push to `develop`:

```yaml
global:
  acmCertArn: "arn:aws:acm:us-east-1:ACCOUNT:certificate/..."

identity-service:
  image:
    repository: "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/procurement-identity"
    tag: "abc1234"          ← git SHA short hash of the triggering commit
  serviceAccount:
    annotations:
      eks.amazonaws.com/role-arn: "arn:aws:iam::ACCOUNT:role/dev-identity-service-irsa"

# ... same pattern for all 6 services
```

After the CD pipeline commits this file, ArgoCD detects the change and rolls out the new image automatically.

### `values-prod.yaml`

Same structure as `values-dev.yaml`, updated by `cd-prod.yml` on push to `main` (with manual approval gate via GitHub Environments).

---

## GitOps Deployment Flow

```
Push to develop branch
        │
        ▼
GitHub Actions: cd-dev.yml
  ├─ Build & push 6 Docker images to ECR (matrix strategy, parallel)
  ├─ Read Terraform outputs: IRSA ARNs, ACM cert ARN
  ├─ Update values-dev.yaml (image tags, IRSA annotations)
  └─ Commit & push values-dev.yaml to repo
        │
        ▼
ArgoCD (in-cluster, auto-sync enabled)
  └─ Detects Git change in helm/procurement-platform/values-dev.yaml
  └─ Runs helm upgrade --install in procurement-dev namespace
  └─ AWS LBC reconciles ALB rules
```

No `kubectl` or `helm` commands are run from CI directly. The cluster state is fully owned by ArgoCD.

---

## ArgoCD Application

The ArgoCD App-of-Apps manifest lives in `gitops/applications/app-of-apps.yaml`. When ArgoCD is first bootstrapped (`scripts/bootstrap-cluster.sh`), it is given this manifest which then registers the main procurement-platform application pointing at `helm/procurement-platform` with the environment-specific values overlay.

---

## Local Helm Commands

```bash
# Update sub-chart dependencies (run after changing Chart.yaml)
helm dependency update helm/procurement-platform

# Lint the chart with dev values
helm lint helm/procurement-platform \
  -f helm/procurement-platform/values.yaml \
  -f helm/procurement-platform/values-dev.yaml

# Dry-run template render (inspect generated YAML)
helm template procurement-dev helm/procurement-platform \
  -f helm/procurement-platform/values.yaml \
  -f helm/procurement-platform/values-dev.yaml \
  --namespace procurement-dev

# Manual install/upgrade (normally done by ArgoCD)
helm upgrade --install procurement-dev helm/procurement-platform \
  -f helm/procurement-platform/values.yaml \
  -f helm/procurement-platform/values-dev.yaml \
  --namespace procurement-dev \
  --create-namespace
```

---

## IRSA and Secrets Manager Integration

Each service's pod assumes its IRSA role (via the `ServiceAccount` annotation). At startup the application calls Secrets Manager using the IRSA credentials and loads all runtime configuration (DB table names, JWT secrets, Cognito IDs, Bedrock model IDs) — nothing sensitive lives in the Helm values or the Docker image.

This design means:
- Rotating secrets requires no redeployment — just update the Secrets Manager value and restart the pod
- Developers never see production credentials
- The IRSA role boundary prevents any service from reading another service's secret

---

*Vinay Kumar Kondoju — ProcureFlow Procurement Platform*
