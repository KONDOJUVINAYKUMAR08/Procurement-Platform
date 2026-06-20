resource "aws_secretsmanager_secret" "app_secrets" {
  for_each                = toset(var.services)
  name                    = "procurement/${var.environment}/${each.value}"
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = 0
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "app_secrets_val" {
  for_each  = toset(var.services)
  secret_id = aws_secretsmanager_secret.app_secrets[each.key].id
  secret_string = jsonencode(merge(
    {
      "ENVIRONMENT" = var.environment
    },
    var.dynamic_outputs
  ))
}
