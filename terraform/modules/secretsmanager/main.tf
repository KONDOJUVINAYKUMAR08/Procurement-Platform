resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "procurement/${var.environment}/app-config"
  description             = "Application secrets for Procurement Platform"
  kms_key_id              = var.kms_key_id
  recovery_window_in_days = 0
  tags = {
    Name        = "procurement-${var.environment}-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET         = "CHANGE_ME_strong_jwt_secret_min_32_chars"
    JWT_REFRESH_SECRET = "CHANGE_ME_strong_jwt_refresh_secret_min_32"
    AWS_REGION         = var.aws_region
    AWS_S3_BUCKET      = var.s3_bucket_name
    AWS_KMS_KEY_ID     = var.kms_key_id
    NODE_ENV           = "production"
    PORT               = "5000"
    CORS_ORIGIN        = var.cors_origin
  })
}
