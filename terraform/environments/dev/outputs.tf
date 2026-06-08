output "public_alb_dns" {
  value = module.public_alb.alb_dns_name
}

output "internal_alb_dns" {
  value = module.internal_alb.alb_dns_name
}

output "kms_key_arn" {
  value = module.kms.key_arn
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "secret_name" {
  value = module.secretsmanager.secret_name
}

output "fqdn" {
  value = module.route53.fqdn
}
