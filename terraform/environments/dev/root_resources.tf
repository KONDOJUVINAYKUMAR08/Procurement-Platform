resource "aws_kms_key" "procurement_key" {
  description             = "KMS key for procurement platform dev - S3 and field encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = {
    Name        = "procurement-dev-kms-key"
    Environment = "dev"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "procurement_key_alias" {
  name          = "alias/procurement-dev"
  target_key_id = aws_kms_key.procurement_key.key_id
}

resource "aws_s3_bucket" "documents" {
  bucket = var.s3_bucket_name
  tags = {
    Name        = "procurement-dev-documents-08"
    Environment = "dev"
  }

  lifecycle {
    prevent_destroy = true
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

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "procurement/dev/app-config"
  description             = "Application secrets for Procurement Platform (dev)"
  kms_key_id              = aws_kms_key.procurement_key.arn
  recovery_window_in_days = 0
  tags = {
    Name        = "procurement-dev-secrets"
    Environment = "dev"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "random_string" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_string" "jwt_refresh_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET         = random_string.jwt_secret.result
    JWT_REFRESH_SECRET = random_string.jwt_refresh_secret.result
    AWS_REGION         = var.aws_region
    AWS_S3_BUCKET      = var.s3_bucket_name
    AWS_KMS_KEY_ID     = aws_kms_key.procurement_key.arn
    NODE_ENV           = "production"
    PORT               = "5000"
    CORS_ORIGIN        = "https://procurement.rxpulse.online"
  })
}


