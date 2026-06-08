resource "aws_dynamodb_table" "users" {
  name         = "procurement-${var.environment}-users"
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
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-users"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "purchase_orders" {
  name         = "procurement-${var.environment}-purchase-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-purchase-orders"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "vendors" {
  name         = "procurement-${var.environment}-vendors"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-vendors"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "invoices" {
  name         = "procurement-${var.environment}-invoices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-invoices"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "contracts" {
  name         = "procurement-${var.environment}-contracts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-contracts"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "documents" {
  name         = "procurement-${var.environment}-documents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }
  tags = {
    Name        = "procurement-${var.environment}-documents"
    Environment = var.environment
  }
}
