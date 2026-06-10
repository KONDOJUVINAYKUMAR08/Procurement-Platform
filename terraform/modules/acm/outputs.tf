output "certificate_arn" {
  value = var.environment == "dev" ? aws_acm_certificate.cert[0].arn : data.aws_acm_certificate.cert[0].arn
}
