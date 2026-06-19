# Procurement Platform — Architecture

## 1. Application Architecture (microservices)

```mermaid
flowchart TB
    User["Browser"]

    subgraph ALB["AWS Application Load Balancer (one ALB, 6 grouped Ingress rules)"]
        direction TB
    end

    User -->|HTTPS procurement-dev.rxpulse.online| ALB

    ALB -->|"/"| FE["frontend\n(React + nginx static)"]
    ALB -->|"/api/auth /api/users /api/hr"| ID["identity-service\n:5001"]
    ALB -->|"/api/vendors /api/purchase-* /api/contracts"| PR["procurement-service\n:5003"]
    ALB -->|"/api/invoices /api/payments /api/customers"| FI["finance-service\n:5002"]
    ALB -->|"/api/documents /api/notifications /api/audit"| DO["document-service\n:5004"]
    ALB -->|"/api/ai"| AI["ai-service\n:5006"]

    AI -.->|in-cluster HTTP| ID
    AI -.->|in-cluster HTTP| PR
    AI -.->|in-cluster HTTP| FI
    AI -.->|in-cluster HTTP| DO

    ID --> DDB1[("DynamoDB\nIdentity_User, HR_*")]
    PR --> DDB2[("DynamoDB\nProcurement_*")]
    FI --> DDB3[("DynamoDB\nFinance_*")]
    DO --> DDB4[("DynamoDB\nDocument_*")]
    DO --> S3[("S3\nDocuments, KMS-encrypted")]
    AI --> DDB5[("DynamoDB\nAI_*")]
    AI --> Bedrock["Amazon Bedrock\nNova Pro + Embeddings"]

    ID & PR & FI & DO & AI -->|IRSA| SM["Secrets Manager\n(per-service secret)"]
```

No custom API gateway — the ALB Ingress (AWS Load Balancer Controller) does all path-based routing directly to each service's Kubernetes Service. Every service is independently deployable, independently scaled, and reads its own secret from Secrets Manager via its own IRSA role (no shared credentials).

## 2. AWS Infrastructure Architecture

```mermaid
flowchart TB
    subgraph GH["GitHub"]
        Repo["Procurement-Platform repo"]
        TFApply["terraform-apply.yml\n(manual, per environment)"]
        TFDestroy["terraform-destroy.yml\n(manual, confirm-gated)"]
        CD["cd.yml\n(build images + bump Helm values)\nmain only for prod"]
    end

    OIDC["GitHub OIDC\nIAM Role\n(no long-lived keys)"]
    Repo --> OIDC

    subgraph Shared["terraform/environments/shared (account-global)"]
        ECR["6x ECR repos"]
        R53["Route53 zone\nrxpulse.online"]
        ACM["ACM cert\n*.rxpulse.online (validated)"]
    end

    subgraph Dev["terraform/environments/dev"]
        VPC1["VPC"]
        EKS1["EKS: dev-eks\n(2 nodes, t3.medium)"]
        DDB1["19x DynamoDB tables"]
        S3D["S3: documents bucket\n(SSE-KMS)"]
        COG1["Cognito User Pool"]
        SM1["Secrets Manager\n(6 per-service secrets)"]
        IRSA1["IRSA roles\n(6 services + LB Controller)"]
    end

    subgraph Prod["terraform/environments/prod (not yet applied)"]
        EKS2["EKS: prod-eks"]
    end

    TFApply -->|assumes role via OIDC| OIDC
    OIDC --> Shared
    OIDC --> Dev
    OIDC --> Prod

    CD -->|push images| ECR
    CD -->|read-only tf output| Dev
    CD -->|read-only tf output| Prod
    CD -->|commit values-*.yaml| Repo

    subgraph EKSCluster["Inside dev-eks"]
        ArgoCD["ArgoCD\n(app-of-apps, auto-sync)"]
        LBC["AWS Load Balancer Controller"]
        Pods["procurement-dev namespace\n6 service Deployments"]
        ArgoCD -->|watches Helm values in Repo| Pods
        LBC -->|creates/manages| ALBRes["ALB"]
        Pods --> ALBRes
    end

    Repo -.->|GitOps pull| ArgoCD
    EKS1 -.-> EKSCluster
    Pods --> DDB1
    Pods --> S3D
    Pods --> SM1
    Pods -->|IRSA| IRSA1

    R53 -->|alias record| ALBRes
    ACM -->|TLS termination| ALBRes
```

## 3. State and pipeline boundaries

| Concern | Owner | Trigger |
|---|---|---|
| VPC, EKS, DynamoDB, Cognito, Secrets Manager, IAM/IRSA | `terraform-apply.yml` | Manual, per environment (`shared`/`dev`/`prod`) |
| Destroying any environment | `terraform-destroy.yml` | Manual, requires typing environment name to confirm |
| Docker image build/push + Helm values bump | `cd.yml` | Auto on push to `main`; `workflow_dispatch` for manual/test runs on any branch |
| Actual deployment to the cluster | ArgoCD (in-cluster) | Auto-sync on every Helm values change pulled from Git — not from CI directly |
| Production traffic | `cd.yml`'s `deploy-prod` job | Only runs when `github.ref == refs/heads/main`, gated behind the `prod` GitHub Environment (manual approval) |

Terraform state lives in S3 (`procurement-tf-state-global`), one key per environment (`environments/{shared,dev,prod}/terraform.tfstate`), locked via DynamoDB (`terraform-state-lock`).
