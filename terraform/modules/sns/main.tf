resource "aws_sns_topic" "alerts" {
  name = "procurement-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.recipient_email
}

# -----------------------------------------------------------------------------
# Amazon SES Email Identity for Alerts
# -----------------------------------------------------------------------------
resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

resource "aws_ses_email_identity" "recipient" {
  email = var.recipient_email
}

# -----------------------------------------------------------------------------
# SNS Topic Policy to allow EventBridge and CloudWatch to publish
# -----------------------------------------------------------------------------
resource "aws_sns_topic_policy" "default" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Monitoring alerts parsing Lambda function (terraform-aws-modules/lambda/aws)
# -----------------------------------------------------------------------------
module "lambda_function" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "procurement-${var.environment}-monitoring-alerts"
  description   = "Processes CloudWatch and ASG EventBridge alerts and sends HTML emails via SES"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30

  source_path = "${path.module}/lambda"

  environment_variables = {
    SENDER_EMAIL    = var.sender_email
    RECIPIENT_EMAIL = var.recipient_email
    ENVIRONMENT     = var.environment
  }

  attach_policy_statements = true
  policy_statements = {
    ses = {
      effect    = "Allow"
      actions   = ["ses:SendEmail", "ses:SendRawEmail"]
      resources = ["*"]
    }
  }

  allowed_triggers = {
    SNS = {
      principal  = "sns.amazonaws.com"
      source_arn = aws_sns_topic.alerts.arn
    }
  }

  create_current_version_allowed_triggers = false
}

# -----------------------------------------------------------------------------
# SNS Subscription to trigger Lambda
# -----------------------------------------------------------------------------
resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = module.lambda_function.lambda_function_arn
}
