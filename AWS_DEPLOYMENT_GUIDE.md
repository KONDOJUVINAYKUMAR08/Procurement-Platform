# AWS Deployment Guide — Procurement Platform

> Complete step-by-step guide to provision infrastructure, connect all AWS services, run the application, and bake AMIs.

---

## Architecture Overview

```
Internet
   │
   ▼
Public ALB  ──────────────────────────────────────
   │                                              │
   ▼                                              ▼
Frontend EC2 (AZ-a)              Frontend EC2 (AZ-b)
[React + Nginx]                  [React + Nginx]
Private Frontend Subnet          Private Frontend Subnet
   │ (calls Internal ALB)
   ▼
Internal ALB  ────────────────────────────────────
   │                                              │
   ▼                                              ▼
Backend EC2 (AZ-a)               Backend EC2 (AZ-b)
[Node.js API Gateway]            [Node.js API Gateway]
Private Backend Subnet           Private Backend Subnet
   │           │        │
   ▼           ▼        ▼
DynamoDB     S3       Secrets
(VPC         (KMS     Manager
Endpoint)   Encrypted)

Public Subnets → Bastion Hosts (SSH) + ALB
NAT Gateways → internet access for private subnets (npm, apt)
```

**Subnets (us-east-1):**
| Subnet | CIDR | Tier |
|--------|------|------|
| public-1 (us-east-1a) | 10.0.1.0/24 | ALB + Bastion |
| public-2 (us-east-1b) | 10.0.2.0/24 | ALB + Bastion |
| frontend-1 (us-east-1a) | 10.0.3.0/24 | React (Nginx) |
| frontend-2 (us-east-1b) | 10.0.4.0/24 | React (Nginx) |
| backend-1 (us-east-1a) | 10.0.5.0/24 | Node.js API |
| backend-2 (us-east-1b) | 10.0.6.0/24 | Node.js API |

---

## Prerequisites

Install these tools on your **local machine** before starting:

```bash
# 1. Terraform (v1.5+)
# Download: https://developer.hashicorp.com/terraform/install

# 2. AWS CLI (v2)
# Download: https://aws.amazon.com/cli/

# 3. Configure AWS credentials
aws configure
# Enter: AWS Access Key ID
# Enter: AWS Secret Access Key
# Enter: Default region: us-east-1
# Enter: Default output format: json

# Verify:
aws sts get-caller-identity
```

---

## PHASE 1 — Provision Infrastructure with Terraform

### Step 1: Navigate to the dev environment

```bash
cd terraform/environments/dev
```

### Step 2: Initialise Terraform

```bash
terraform init
```

### Step 3: Review what will be created

```bash
terraform plan
```

Terraform will create:
- VPC (6 subnets, 2 NAT Gateways, 1 IGW, Route Tables)
- Security Groups (Bastion, Public ALB, Frontend, Internal ALB, Backend)
- **KMS Key** (for encryption at rest)
- **S3 Bucket** (KMS-encrypted document storage)
- **Secrets Manager Secret** (JWT keys + app config)
- **DynamoDB Tables** (Users, Purchase Orders, Vendors, Invoices, Contracts, Documents)
- IAM Role + Instance Profile (with DynamoDB, S3, KMS, Secrets Manager, CloudWatch policies)
- Public ALB + Internal ALB
- ASG Launch Templates (using placeholder AMI IDs for now)

### Step 4: Apply the infrastructure

```bash
terraform apply
# Type: yes
```

### Step 5: Note the outputs

After `apply` completes, note these values — you will need them:

```
public_alb_dns   = "procurement-dev-public-alb-XXXXXXXXXX.us-east-1.elb.amazonaws.com"
internal_alb_dns = "procurement-dev-internal-alb-XXXXXXXXXX.us-east-1.elb.amazonaws.com"
kms_key_arn      = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
s3_bucket_name   = "procurement-dev-documents"
secret_name      = "procurement/dev/app-config"
```

---

## PHASE 2 — Update Secrets Manager with Final Values

After infrastructure is provisioned, update the secret with the real Internal ALB DNS:

```bash
# Update the CORS_ORIGIN with your Public ALB DNS
aws secretsmanager update-secret \
  --secret-id "procurement/dev/app-config" \
  --secret-string '{
    "JWT_SECRET": "your-strong-jwt-secret-min-32-characters",
    "JWT_REFRESH_SECRET": "your-strong-jwt-refresh-secret-min-32",
    "AWS_REGION": "us-east-1",
    "AWS_S3_BUCKET": "procurement-dev-documents",
    "AWS_KMS_KEY_ID": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/YOUR_KEY_ID",
    "NODE_ENV": "production",
    "PORT": "5000",
    "CORS_ORIGIN": "http://procurement-dev-public-alb-XXXXXXXXXX.us-east-1.elb.amazonaws.com"
  }' \
  --region us-east-1
```

> **Important:** Replace all placeholder values with real ones from Terraform outputs.

---

## PHASE 3 — Bake the AMIs

### Step 1: Launch a temporary Ubuntu EC2 instance

In the AWS Console:
1. Go to **EC2 → Launch Instance**
2. Choose **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
3. Instance type: `t3.small`
4. **Network**: Select the `procurement-dev-vpc`
5. **Subnet**: Select a **public** subnet (`10.0.1.0/24`)
6. **Auto-assign Public IP**: Enable
7. **IAM Instance Profile**: Select `procurement-dev-ec2-profile`
8. **Security Group**: Select `procurement-dev-bastion-sg` (port 22 open)
9. **Key Pair**: Use an existing key pair or create new
10. Launch the instance

### Step 2: SSH into the instance

```bash
ssh -i your-key.pem ubuntu@<instance-public-ip>
```

### Step 3: Copy the project to the instance

From your local machine (NOT inside SSH):

```bash
# Create a tarball of the project (excluding node_modules, dist)
tar --exclude='./node_modules' \
    --exclude='./.git' \
    --exclude='./backend/*/dist' \
    --exclude='./frontend/build' \
    -czf procurement-platform.tar.gz .

# Copy to the instance
scp -i your-key.pem procurement-platform.tar.gz ubuntu@<instance-public-ip>:/tmp/
```

### Step 4: Run the BACKEND AMI script

SSH into the instance and run:

```bash
# Extract the project
sudo mkdir -p /opt/procurement-platform
sudo tar -xzf /tmp/procurement-platform.tar.gz -C /opt/procurement-platform
sudo chown -R ubuntu:ubuntu /opt/procurement-platform

# Run the backend setup script
cd /opt/procurement-platform
sudo bash scripts/ami-setup/setup-backend.sh
```

The script will:
- Install Node.js 20 via apt
- Install PM2 globally
- Run `npm run build:backend` to compile TypeScript
- Start the API Gateway on port 5000 via PM2

### Step 5: Verify the backend is working

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs procurement-api-gateway --lines 50

# Test the health endpoint
curl http://localhost:5000/api/health
# Expected: {"status":"ok","service":"api-gateway","timestamp":"..."}
```

> **How DynamoDB Connects:** The backend uses **Dynamoose** which automatically uses the EC2 IAM Instance Profile to authenticate with DynamoDB. No credentials needed — the IAM role grants access. In production mode (`NODE_ENV=production`), it connects to real DynamoDB tables via the **VPC Endpoint** (no internet traversal).

> **How Secrets Manager Connects:** On startup, the API Gateway calls `getSecrets()` which reads `procurement/dev/app-config` from Secrets Manager using the EC2 IAM role. JWT secrets, S3 bucket names, and KMS key IDs are all loaded automatically.

> **How S3 Connects:** The document service uses `uploadToS3()` which uploads files using AWS SDK v2. It uses the EC2 IAM role for auth and KMS envelope encryption (`ServerSideEncryption: 'aws:kms'`).

### Step 6: Create the Backend AMI

1. Go to **EC2 Console → Select the instance**
2. Click **Actions → Image and Templates → Create Image**
3. Image name: `procurement-backend-v1`
4. Description: `Backend API Gateway - Node.js 20, PM2`
5. Click **Create Image**
6. **Note the AMI ID** (e.g., `ami-0a1b2c3d4e5f67890`)

---

### Step 7: Run the FRONTEND AMI script

Launch a fresh new Ubuntu instance (same way as Step 1), SSH in, copy the project, then run:

```bash
sudo mkdir -p /opt/procurement-platform
sudo tar -xzf /tmp/procurement-platform.tar.gz -C /opt/procurement-platform
sudo chown -R ubuntu:ubuntu /opt/procurement-platform

cd /opt/procurement-platform/frontend

# Set the Internal ALB as the API endpoint for the React build
echo "REACT_APP_API_URL=http://<internal_alb_dns_from_terraform_output>" | \
  sudo tee /opt/procurement-platform/frontend/.env

sudo bash /opt/procurement-platform/scripts/ami-setup/setup-frontend.sh
```

### Step 8: Verify the frontend is working

```bash
# Check Nginx is running
sudo systemctl status nginx

# Test locally
curl http://localhost
# Expected: HTML of the React app index.html
```

### Step 9: Create the Frontend AMI

1. Go to **EC2 Console → Select the frontend instance**
2. Click **Actions → Image and Templates → Create Image**
3. Image name: `procurement-frontend-v1`
4. Description: `Frontend React App - Nginx`
5. Click **Create Image**
6. **Note the AMI ID**

---

## PHASE 4 — Update Terraform with Real AMI IDs

Update the `terraform/environments/dev/main.tf` variables OR use a `terraform.tfvars` file:

```bash
# Create a tfvars file (DO NOT commit this to git)
cat > terraform/environments/dev/terraform.tfvars << 'EOF'
frontend_ami_id = "ami-0XXXXXXXXXXXXXXXX"  # Your frontend AMI
backend_ami_id  = "ami-0XXXXXXXXXXXXXXXX"  # Your backend AMI
s3_bucket_name  = "procurement-dev-documents"
aws_region      = "us-east-1"
EOF
```

Then re-apply Terraform to update the ASG Launch Templates with the real AMIs:

```bash
cd terraform/environments/dev
terraform apply
```

The ASGs will now launch real instances using your baked AMIs.

---

## PHASE 5 — Test the Application End-to-End

### Step 1: Access the application

Open your browser and navigate to:
```
http://<public_alb_dns_from_terraform_output>
```

### Step 2: Test each layer

**1. Authentication (Secrets Manager → JWT):**
- Login with `admin@procurement.com / Admin@123`
- If login succeeds, JWT signing is working (secrets were loaded from Secrets Manager ✅)

**2. Dashboard (DynamoDB):**
- After login, the dashboard loads aggregate stats
- If data appears, DynamoDB is connected via IAM role ✅

**3. Document Upload (S3 + KMS):**
- Go to **Documents** module
- Upload a PDF or image
- Go to AWS Console → S3 → `procurement-dev-documents`
- Verify the file appears and is **KMS-encrypted** ✅

**4. Vendor/Purchase Orders (DynamoDB CRUD):**
- Create a new vendor or purchase order
- Reload the page — if data persists, DynamoDB writes are working ✅

### Step 3: Verify AWS service connections in console

```bash
# Check DynamoDB tables have data
aws dynamodb scan --table-name procurement-dev-users --region us-east-1

# Check S3 for uploaded documents
aws s3 ls s3://procurement-dev-documents/

# Check Secrets Manager secret is readable
aws secretsmanager get-secret-value \
  --secret-id procurement/dev/app-config \
  --region us-east-1

# Check CloudWatch logs from backend instances
aws logs describe-log-groups --region us-east-1
```

---

## PHASE 6 — SSH Access via Bastion Host

To SSH into private backend/frontend instances:

```bash
# First SSH into the Bastion Host (in a public subnet)
ssh -i your-key.pem -A ubuntu@<bastion-public-ip>

# From bastion, SSH into a private backend instance
ssh ubuntu@<private-instance-ip>

# Check application status
pm2 status
pm2 logs procurement-api-gateway
```

---

## Environment Variables Reference

When the application starts in production, these env vars are set **automatically from Secrets Manager**. For manual testing on a raw EC2 instance, export them:

```bash
export NODE_ENV=production
export PORT=5000
export AWS_REGION=us-east-1
export SECRET_NAME=procurement/dev/app-config
# The above is all that's needed — Secrets Manager loads the rest
```

If you need to override manually (bypass Secrets Manager):
```bash
export JWT_SECRET=your-jwt-secret
export JWT_REFRESH_SECRET=your-refresh-secret
export AWS_S3_BUCKET=procurement-dev-documents
export AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID
export CORS_ORIGIN=http://your-alb-dns
```

---

## How Each AWS Service Is Used

| Service | Purpose | How Connected |
|---------|---------|---------------|
| **DynamoDB** | All application data (users, orders, vendors, invoices) | Dynamoose via IAM Role — no credentials |
| **S3** | Document file storage (PDFs, images, contracts) | AWS SDK via IAM Role — KMS encrypted |
| **KMS** | Encrypts S3 files + DynamoDB at rest | AWS SDK via IAM Role |
| **Secrets Manager** | JWT secrets, app config | `getSecrets()` on startup via IAM Role |
| **VPC Endpoint** | DynamoDB accessed without internet routing | Gateway Endpoint in route tables |
| **ALB (Public)** | Routes internet traffic → frontend instances | Port 80 listener |
| **ALB (Internal)** | Routes frontend → backend instances | Port 80 listener, internal DNS |
| **IAM Role** | Grants EC2 access to all services | Attached via Instance Profile |
| **CloudWatch** | Application log streaming | `winston` logger → CloudWatch Logs |

---

## Troubleshooting

**Backend won't start:**
```bash
pm2 logs procurement-api-gateway --lines 100
# Look for: "DynamoDB connected to region" or error messages
```

**DynamoDB access denied:**
```bash
# Verify the IAM role is attached to the instance
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
# Should return the role name
```

**S3 upload fails:**
```bash
# Test S3 access from the instance
aws s3 ls s3://procurement-dev-documents
# If this works, IAM permissions are correct
```

**Secrets Manager fails:**
```bash
# Test secret retrieval from instance
aws secretsmanager get-secret-value \
  --secret-id procurement/dev/app-config \
  --region us-east-1
```

**Frontend can't reach backend:**
```bash
# From a frontend instance, test the internal ALB
curl http://<internal-alb-dns>/api/health
# Expected: {"status":"ok","service":"api-gateway"}
```
