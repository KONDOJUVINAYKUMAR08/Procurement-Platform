terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─────────────────────────────────────────────────────────
# Variables
# ─────────────────────────────────────────────────────────
variable "aws_region" {
  default = "us-east-1"
}

variable "frontend_ami_id" {
  type        = string
  description = "Custom AMI ID baked for the Frontend (React + Nginx)"
  default     = "ami-xxxxxxxxxxxxxxxxx" # Replace after baking AMI
}

variable "backend_ami_id" {
  type        = string
  description = "Custom AMI ID baked for the Backend (Node.js API Gateway)"
  default     = "ami-xxxxxxxxxxxxxxxxx" # Replace after baking AMI
}

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for document storage"
  default     = "procurement-dev-documents"
}

variable "kms_key_arn" {
  type        = string
  description = "ARN of KMS key for S3 and field encryption (leave empty to use AWS managed key)"
  default     = ""
}

# ─────────────────────────────────────────────────────────
# KMS Key (for S3 encryption and sensitive field encryption)
# ─────────────────────────────────────────────────────────
resource "aws_kms_key" "procurement_key" {
  description             = "KMS key for procurement platform dev - S3 and field encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "procurement-dev-kms-key"
    Environment = "dev"
  }
}

resource "aws_kms_alias" "procurement_key_alias" {
  name          = "alias/procurement-dev"
  target_key_id = aws_kms_key.procurement_key.key_id
}

# ─────────────────────────────────────────────────────────
# S3 Bucket (document storage, KMS encrypted)
# ─────────────────────────────────────────────────────────
resource "aws_s3_bucket" "documents" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "procurement-dev-documents"
    Environment = "dev"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.procurement_key.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────────────────
# Secrets Manager (JWT secrets, app config)
# ─────────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "procurement/dev/app-config"
  description             = "Application secrets for Procurement Platform (dev)"
  kms_key_id              = aws_kms_key.procurement_key.arn
  recovery_window_in_days = 0 # Allows immediate deletion in dev

  tags = {
    Name        = "procurement-dev-secrets"
    Environment = "dev"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET         = "CHANGE_ME_strong_jwt_secret_min_32_chars"
    JWT_REFRESH_SECRET = "CHANGE_ME_strong_jwt_refresh_secret_min_32"
    AWS_REGION         = var.aws_region
    AWS_S3_BUCKET      = var.s3_bucket_name
    AWS_KMS_KEY_ID     = aws_kms_key.procurement_key.arn
    NODE_ENV           = "production"
    PORT               = "5000"
    CORS_ORIGIN        = "http://${module.public_alb.alb_dns_name}"
  })
}

# ─────────────────────────────────────────────────────────
# DynamoDB Tables
# ─────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "users" {
  name           = "procurement-dev-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-users"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "purchase_orders" {
  name           = "procurement-dev-purchase-orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-purchase-orders"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "vendors" {
  name           = "procurement-dev-vendors"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-vendors"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "invoices" {
  name           = "procurement-dev-invoices"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-invoices"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "contracts" {
  name           = "procurement-dev-contracts"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-contracts"
    Environment = "dev"
  }
}

resource "aws_dynamodb_table" "documents" {
  name           = "procurement-dev-documents"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.procurement_key.arn
  }

  tags = {
    Name        = "procurement-dev-documents"
    Environment = "dev"
  }
}

# ─────────────────────────────────────────────────────────
# Networking Modules
# ─────────────────────────────────────────────────────────
module "vpc" {
  source                   = "../../modules/vpc"
  environment              = "dev"
  aws_region               = var.aws_region
  vpc_cidr                 = "10.0.0.0/16"
  azs                      = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets           = ["10.0.1.0/24", "10.0.2.0/24"]
  frontend_private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]
  backend_private_subnets  = ["10.0.5.0/24", "10.0.6.0/24"]
}

module "security_groups" {
  source      = "../../modules/security-groups"
  vpc_id      = module.vpc.vpc_id
  environment = "dev"
}

# ─────────────────────────────────────────────────────────
# IAM Module (now includes S3, KMS, Secrets, CloudWatch)
# ─────────────────────────────────────────────────────────
module "iam" {
  source         = "../../modules/iam"
  environment    = "dev"
  s3_bucket_name = var.s3_bucket_name
  kms_key_arn    = aws_kms_key.procurement_key.arn
}

# ─────────────────────────────────────────────────────────
# Load Balancers
# ─────────────────────────────────────────────────────────
module "public_alb" {
  source            = "../../modules/alb"
  name              = "public-alb"
  environment       = "dev"
  vpc_id            = module.vpc.vpc_id
  subnets           = module.vpc.public_subnets
  security_group_id = module.security_groups.public_alb_sg_id
  internal          = false
}

module "internal_alb" {
  source            = "../../modules/alb"
  name              = "internal-alb"
  environment       = "dev"
  vpc_id            = module.vpc.vpc_id
  subnets           = module.vpc.backend_subnets
  security_group_id = module.security_groups.internal_alb_sg_id
  internal          = true
}

# ─────────────────────────────────────────────────────────
# Auto Scaling Groups (use placeholder AMIs until baked)
# ─────────────────────────────────────────────────────────
module "frontend_asg" {
  source               = "../../modules/asg"
  name                 = "frontend-asg"
  environment          = "dev"
  vpc_zone_identifier  = module.vpc.frontend_subnets
  target_group_arn     = module.public_alb.target_group_arn
  security_group_id    = module.security_groups.frontend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id               = var.frontend_ami_id
  instance_type        = "t3.small"
}

module "backend_asg" {
  source               = "../../modules/asg"
  name                 = "backend-asg"
  environment          = "dev"
  vpc_zone_identifier  = module.vpc.backend_subnets
  target_group_arn     = module.internal_alb.target_group_arn
  security_group_id    = module.security_groups.backend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id               = var.backend_ami_id
  instance_type        = "t3.small"
}

# ─────────────────────────────────────────────────────────
# Outputs (for application configuration)
# ─────────────────────────────────────────────────────────
output "public_alb_dns" {
  description = "Public ALB DNS — point your domain here or access directly"
  value       = module.public_alb.alb_dns_name
}

output "internal_alb_dns" {
  description = "Internal ALB DNS — frontend uses this to call the backend"
  value       = module.internal_alb.alb_dns_name
}

output "kms_key_arn" {
  description = "KMS Key ARN for application use"
  value       = aws_kms_key.procurement_key.arn
}

output "s3_bucket_name" {
  description = "S3 bucket for document uploads"
  value       = aws_s3_bucket.documents.bucket
}

output "secret_name" {
  description = "Secrets Manager secret name — set SECRET_NAME env var on EC2"
  value       = aws_secretsmanager_secret.app_secrets.name
}
