resource "aws_dynamodb_table" "app_table" {
  for_each = toset(var.tables)
  name           = "${var.environment}-${each.value}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
    kms_key_arn = var.kms_key_arn
  }

  tags = var.tags
}
