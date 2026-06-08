resource "aws_kms_key" "procurement_key" {
  description             = "KMS key for procurement platform - S3 and field encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = {
    Name        = "procurement-${var.environment}-kms-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "procurement_key_alias" {
  name          = "alias/procurement-${var.environment}"
  target_key_id = aws_kms_key.procurement_key.key_id
}
