data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "config_logs" {
  bucket        = "procurement-${var.environment}-config-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  tags = {
    Name        = "procurement-${var.environment}-config-logs"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket                  = aws_s3_bucket.config_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config_logs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissions"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = ["s3:GetBucketAcl", "s3:PutObject"]
        Resource = [
          aws_s3_bucket.config_logs.arn,
          "${aws_s3_bucket.config_logs.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "config" {
  name = "procurement-${var.environment}-config-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_config_configuration_recorder" "main" {
  name     = "procurement-${var.environment}-recorder"
  role_arn = aws_iam_role.config.arn
  recording_group {
    all_supported              = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "procurement-${var.environment}-delivery"
  s3_bucket_name = aws_s3_bucket.config_logs.id
  depends_on     = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_config_rule" "s3_public" {
  name             = "procurement-${var.environment}-s3-public-access-check"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED"
  }
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "sg_world" {
  name             = "procurement-${var.environment}-sg-open-check"
  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }
  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "required_tags" {
  name             = "procurement-${var.environment}-required-tags-check"
  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }
  input_parameters = jsonencode({
    tag1Key   = "Environment"
    tag1Value = var.environment
  })
  depends_on = [aws_config_configuration_recorder.main]
}
