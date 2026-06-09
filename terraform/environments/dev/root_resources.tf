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
    CORS_ORIGIN        = "https://procurement.rxpulse.online"
  })
}

resource "aws_dynamodb_table" "users" {
  name         = "procurement-dev-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "purchase_orders" {
  name         = "procurement-dev-purchase-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "vendors" {
  name         = "procurement-dev-vendors"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "invoices" {
  name         = "procurement-dev-invoices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "contracts" {
  name         = "procurement-dev-contracts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "documents" {
  name         = "procurement-dev-documents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
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

  lifecycle {
    prevent_destroy = true
  }
}
