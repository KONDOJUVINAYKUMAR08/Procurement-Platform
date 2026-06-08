output "secret_name" {
  value = aws_secretsmanager_secret.app_secrets.name
}
output "secret_arn" {
  value = aws_secretsmanager_secret.app_secrets.arn
}
