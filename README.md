# ProcureFlow — Procurement Platform

**Author:** Vinay Kumar Kondoju
**GitHub:** [@KONDOJUVINAYKUMAR08](https://github.com/KONDOJUVINAYKUMAR08)

A full-stack, cloud-native Procurement Management Platform built on AWS. The project was developed across two internal reviews, each progressively adding cloud infrastructure depth — from EC2-based Terraform deployments to a fully automated GitOps pipeline on Kubernetes.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Internal Review 2 — EC2 + Terraform](#internal-review-2--ec2--terraform)
- [Internal Review 3 — EKS + GitOps + CD](#internal-review-3--eks--gitops--cd)
- [Application Modules](#application-modules)
- [Repository Structure](#repository-structure)
- [Branch Guide](#branch-guide)

---

## Project Overview

ProcureFlow is an enterprise-grade procurement platform that covers the full procurement lifecycle:

- Vendor management and onboarding
- Purchase requests and purchase orders
- Contract lifecycle management
- Invoice and payment processing
- HR functions (employees, attendance, payroll, letters)
- Document management with audit trails
- AI-powered contract analysis and invoice intelligence (via Amazon Bedrock)

The frontend is a React + TypeScript single-page application served via nginx. The backend is a Node.js + TypeScript microservices architecture, each service backed by DynamoDB and authenticated via AWS Cognito.

---

## Internal Review 2 — EC2 + Terraform

> **Branch:** `backup/main`
> **Presentation:** `ProcureFlow-Internal-Review-2.pptx`

### What Was Built

The entire AWS infrastructure was provisioned using Terraform. Services ran on EC2 instances managed through Auto Scaling Groups, fronted by an Application Load Balancer.

### Infrastructure Components

| Module | Description |
|--------|-------------|
| **VPC / Networking** | Custom VPC with public subnets, frontend private subnets, and backend private subnets across 2 AZs |
| **Security Groups** | Tiered security groups for ALB, frontend ASG, and backend ASG |
| **IAM** | Instance roles with least-privilege policies for S3, Secrets Manager, and KMS |
| **KMS** | Customer-managed KMS key for encryption at rest |
| **S3** | Document storage bucket with SSE-KMS encryption |
| **Secrets Manager** | Per-service secrets (JWT keys, DB config, Cognito credentials) |
| **ACM** | SSL/TLS certificate provisioned and validated via Route 53 |
| **Route 53** | DNS zone for `rxpulse.online`, A-records aliased to the ALBs |
| **ALB (Public)** | Internet-facing ALB terminating HTTPS, routing to frontend ASG |
| **ALB (Internal)** | Internal ALB for backend microservice routing |
| **ASG (Frontend)** | Auto Scaling Group running nginx + React static build on EC2 |
| **ASG (Backend)** | Auto Scaling Group running Node.js microservices on EC2 |
| **WAF** | AWS WAF attached to the public ALB for common threat protection |
| **SNS + Lambda** | Notification topics with a Lambda-based email dispatcher |
| **CloudWatch** | Log groups, metric alarms, and dashboards per service |

### Services Deployed (IR2)

- `identity-service` — Authentication (JWT + Cognito), user management, HR
- `procurement-service` — Vendors, purchase requests, purchase orders, contracts
- `finance-service` — Invoices, payments, customers
- `document-service` — Document storage (S3), audit logs, notifications
- `api-gateway` — Single entry-point gateway routing to backend services

### How Deployment Worked (IR2)

1. `terraform apply` provisions all AWS infrastructure from `terraform/environments/dev`
2. AMI setup scripts (`scripts/ami-setup/`) install Node.js, build services, and configure systemd on the EC2 instances
3. EC2 user-data scripts launch the services on boot
4. Route 53 routes `procurement-dev.rxpulse.online` → Public ALB → Frontend ASG → Internal ALB → Backend services

---

## Internal Review 3 — EKS + GitOps + CD

> **Branch:** `main` (current)
> **Presentation:** `Procurement-Platform-Internal-Review-3.pptx`

### What Was Added

Internal Review 3 extended the project by migrating the compute layer from EC2 to **Amazon EKS (Kubernetes)**, introducing a **GitOps deployment model** using **ArgoCD**, and implementing a full **CI/CD pipeline** with GitHub Actions.

### Architecture Overview

```
Browser
  │
  ▼ HTTPS (procurement-dev.rxpulse.online)
AWS Application Load Balancer  ← created by AWS Load Balancer Controller
  │
  ├── /                      → frontend (React + nginx)
  ├── /api/auth /api/users   → identity-service :5001
  ├── /api/vendors /api/purchase-* /api/contracts → procurement-service :5003
  ├── /api/invoices /api/payments → finance-service :5002
  ├── /api/documents /api/audit  → document-service :5004
  └── /api/ai                → ai-service :5006
                                    └── Amazon Bedrock (Nova Pro + Embeddings)
```

All services run as Kubernetes Deployments in the `procurement-dev` namespace inside `dev-eks`. Each service has its own IRSA role (IAM Role for Service Accounts) — no shared credentials.

### Terraform Infrastructure (IR3)

The Terraform codebase was refactored into cleanly separated environment stacks and reusable modules:

```
terraform/
├── environments/
│   ├── shared/    ← ECR repos, Route53 zone, ACM cert (account-global, applied once)
│   ├── dev/       ← VPC, EKS cluster, DynamoDB, Cognito, Secrets Manager, IRSA, WAF
│   └── prod/      ← Production mirror of dev (not yet applied)
└── modules/
    ├── vpc/           ← VPC, subnets, NAT gateway, IGW
    ├── eks/           ← EKS cluster + managed node group (t3.medium × 2)
    ├── ecr/           ← 6 ECR repositories (one per service)
    ├── dynamodb/      ← 19 DynamoDB tables with GSIs, SSE-KMS
    ├── cognito/       ← User Pool + App Client
    ├── secrets-manager/ ← 6 per-service secrets populated from Terraform outputs
    ├── iam/           ← IRSA roles for each service + AWS Load Balancer Controller
    ├── kms/           ← Customer-managed KMS key
    ├── s3/            ← SSE-KMS encrypted document bucket
    ├── acm/           ← SSL certificate
    ├── route53/       ← DNS zone and records
    ├── waf/           ← AWS WAF WebACL
    ├── sns/           ← SNS topic + Lambda email dispatcher
    └── cloudwatch/    ← Log groups, alarms, dashboards
```

**Terraform state** is stored in S3 (`procurement-tf-state-global`), one key per environment, locked via DynamoDB (`terraform-state-lock`). All GitHub Actions workflows authenticate to AWS using **OIDC** — no long-lived access keys stored as secrets.

### CI/CD Pipeline (IR3)

#### GitHub Actions Workflows

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| `ci.yml` | PR to `main` | Build, Trivy image scan, Snyk dependency scan, SonarQube, `terraform validate`, `helm lint` |
| `terraform-apply.yml` | Manual (`workflow_dispatch`) | `terraform plan` + `terraform apply` for `shared`, `dev`, or `prod` |
| `terraform-destroy.yml` | Manual (confirm-gated) | Safely destroys an environment — requires typing the environment name |
| `cd-dev.yml` | Push to `develop` | Builds 6 Docker images, pushes to ECR, bumps image tags in `values-dev.yaml`, commits back to repo |
| `cd-prod.yml` | Push to `main` (with manual approval) | Same as dev pipeline but targets production; gated by the `prod` GitHub Environment |
| `bootstrap.yml` | Manual | Bootstraps ArgoCD and the AWS Load Balancer Controller into a freshly provisioned EKS cluster |

#### GitOps Flow (ArgoCD)

```
Push to develop
     │
     ▼
GitHub Actions (cd-dev.yml)
  1. Build Docker images (6 services in parallel matrix)
  2. Push tagged images to ECR
  3. Read Terraform outputs (IRSA ARNs, ACM cert ARN)
  4. Update helm/procurement-platform/values-dev.yaml
  5. Commit values file back to the repo

     │  (Git push)
     ▼
ArgoCD (in-cluster, auto-sync ON)
  Detects Helm values change → applies to procurement-dev namespace
  AWS LBC creates/updates the ALB Ingress
```

No `kubectl apply` or `helm upgrade` runs from CI. ArgoCD owns the cluster state entirely.

### Helm Chart Structure (IR3)

```
helm/procurement-platform/
├── Chart.yaml           ← umbrella chart with 6 sub-chart dependencies
├── values.yaml          ← base values (image placeholders, resource limits)
├── values-dev.yaml      ← dev overrides (written by CD pipeline: image tags, IRSA ARNs, ACM ARN)
├── values-prod.yaml     ← prod overrides
└── charts/
    ├── frontend/
    ├── identity-service/
    ├── procurement-service/
    ├── finance-service/
    ├── document-service/
    └── ai-service/
```

Each sub-chart defines a `Deployment`, `Service`, `ServiceAccount` (with IRSA annotation), and contributes to the parent ALB `Ingress` via annotations.

### AI Features (IR3)

The `ai-service` integrates with **Amazon Bedrock**:
- **Contract Intelligence** — Analyses uploaded contract documents, extracts key clauses and risk indicators
- **Invoice Intelligence** — Flags anomalies and risk levels in invoice data
- **Document Search** — Semantic vector search over stored documents using Bedrock embeddings
- **AI Copilot** — Conversational assistant for procurement queries

Embeddings and analysis results are stored in dedicated DynamoDB tables (`AI_Embedding`, `AI_ContractAnalysis`, `AI_InvoiceAnalysis`, `AI_Feedback`). The `ai-service` IRSA role has scoped Bedrock permissions allowing only the configured model IDs.

### DynamoDB Tables (19 tables)

| Domain | Tables |
|--------|--------|
| Identity | `Identity_User` |
| HR | `HR_Employee`, `HR_Attendance`, `HR_Payslip`, `HR_Letter` |
| Procurement | `Procurement_Vendor`, `Procurement_PurchaseRequest`, `Procurement_PurchaseOrder`, `Procurement_Contract` |
| Finance | `Finance_Invoice`, `Finance_Payment`, `Finance_Customer` |
| Document | `Document_Document`, `Document_AuditLog`, `Document_Notification` |
| AI | `AI_ContractAnalysis`, `AI_Embedding`, `AI_InvoiceAnalysis`, `AI_Feedback` |

All tables are encrypted with a customer-managed KMS key and use pay-per-request billing.

---

## Application Modules

| Module | Frontend Route | Backend Service |
|--------|---------------|-----------------|
| Login / Auth | `/login` | `identity-service` |
| Dashboard | `/dashboard` | aggregated |
| Vendors | `/procurement/vendors` | `procurement-service` |
| Purchase Requests | `/procurement/purchase-requests` | `procurement-service` |
| Purchase Orders | `/procurement/purchase-orders` | `procurement-service` |
| Contracts | `/procurement/contracts` | `procurement-service` |
| Invoices | `/finance/invoices` | `finance-service` |
| Payments | `/finance/payments` | `finance-service` |
| Customers | `/finance/customers` | `finance-service` |
| HR — Employees | `/hr/employees` | `identity-service` |
| HR — Attendance | `/hr/attendance` | `identity-service` |
| HR — Payroll | `/hr/payroll` | `identity-service` |
| Documents | `/documents` | `document-service` |
| Audit Logs | `/documents/audit` | `document-service` |
| Notifications | `/documents/notifications` | `document-service` |
| AI — Copilot | `/ai/copilot` | `ai-service` |
| AI — Contract Intelligence | `/ai/contracts` | `ai-service` |
| AI — Invoice Intelligence | `/ai/invoices` | `ai-service` |
| AI — Document Search | `/ai/documents` | `ai-service` |
| User Management | `/settings/users` | `identity-service` |

---

## Repository Structure

```
Procurement-Platform/
├── .github/workflows/          ← CI, CD, Terraform Apply/Destroy, Bootstrap workflows
├── backend/
│   ├── services/
│   │   ├── identity-service/   ← Auth, users, HR
│   │   ├── procurement-service/ ← Vendors, POs, PRs, contracts
│   │   ├── finance-service/    ← Invoices, payments, customers
│   │   ├── document-service/   ← Documents, audit logs, notifications
│   │   └── ai-service/         ← Bedrock AI integrations
│   └── shared/
│       ├── common/             ← Shared config, secrets loader, Cognito client
│       ├── middleware/         ← Auth JWT middleware, audit logging, validation
│       ├── types/              ← Shared TypeScript types
│       └── utils/              ← Shared utility functions
├── frontend/                   ← React + TypeScript + Tailwind CSS SPA
│   └── src/modules/            ← Feature modules (procurement, finance, hr, ai, ...)
├── helm/
│   └── procurement-platform/   ← Umbrella Helm chart with 6 sub-charts
├── gitops/
│   └── applications/           ← ArgoCD App-of-Apps manifest
├── terraform/
│   ├── environments/
│   │   ├── shared/             ← ECR, Route53, ACM (applied once, account-global)
│   │   ├── dev/                ← Dev environment full stack
│   │   └── prod/               ← Prod environment full stack
│   └── modules/                ← Reusable Terraform modules (14 modules)
├── scripts/
│   ├── ami-setup/              ← EC2 AMI bootstrap scripts (IR2)
│   ├── bootstrap-cluster.sh    ← EKS post-provision bootstrap (IR3)
│   ├── deploy-ec2.sh           ← EC2 deployment helper (IR2)
│   └── ecr-push.sh             ← Manual ECR push helper
├── docs/
│   └── ARCHITECTURE.md         ← Detailed architecture diagrams (Mermaid)
├── ProcureFlow-Internal-Review-2.pptx
└── Procurement-Platform-Internal-Review-3.pptx
```

---

## Branch Guide

| Branch | Purpose |
|--------|---------|
| `main` | Internal Review 3 — EKS + GitOps + CD pipeline (current state) |
| `develop` | Active development branch; CD pipeline targets this for dev deployments |
| `backup/main` | Internal Review 2 — EC2 + Terraform baseline (preserved snapshot) |
| `backup/develop` | IR2 development branch snapshot |
| `feature/ai-service` | AI service feature branch |
| `feature/microservices-cognito` | Cognito integration feature branch |

---

*Vinay Kumar Kondoju — ProcureFlow Procurement Platform*
