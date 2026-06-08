resource "aws_iam_role" "ec2_role" {
  name = "procurement-${var.environment}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = {
    Name        = "procurement-${var.environment}-ec2-role"
    Environment = var.environment
  }
}

resource "aws_iam_policy" "dynamodb_policy" {
  name        = "procurement-${var.environment}-dynamodb-policy"
  description = "Allow EC2 instances to access all DynamoDB tables for procurement platform"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:CreateTable",
        "dynamodb:ListTables"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_policy" "s3_policy" {
  name        = "procurement-${var.environment}-s3-policy"
  description = "Allow EC2 instances to read/write procurement documents in S3"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ]
      Resource = [
        "arn:aws:s3:::${var.s3_bucket_name}",
        "arn:aws:s3:::${var.s3_bucket_name}/*"
      ]
    }]
  })
}

resource "aws_iam_policy" "kms_policy" {
  name        = "procurement-${var.environment}-kms-policy"
  description = "Allow EC2 instances to use the KMS key for encryption/decryption"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:GenerateDataKey",
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:DescribeKey",
        "kms:ReEncrypt*"
      ]
      Resource = var.kms_key_arn != "" ? [var.kms_key_arn] : ["*"]
    }]
  })
}

resource "aws_iam_policy" "secrets_policy" {
  name        = "procurement-${var.environment}-secrets-policy"
  description = "Allow EC2 instances to read application secrets from Secrets Manager"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = "arn:aws:secretsmanager:*:*:secret:procurement/${var.environment}/*"
    }]
  })
}

resource "aws_iam_policy" "cloudwatch_policy" {
  name        = "procurement-${var.environment}-cloudwatch-policy"
  description = "Allow EC2 instances to push logs to CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "dynamodb_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}

resource "aws_iam_role_policy_attachment" "s3_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "kms_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.kms_policy.arn
}

resource "aws_iam_role_policy_attachment" "secrets_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.secrets_policy.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "procurement-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
