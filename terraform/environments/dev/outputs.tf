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

output "route53_zone_id" {
  value = module.route53.zone_id
}

output "route53_nameservers" {
  value = module.route53.name_servers
}

output "certificate_arn" {
  value = module.acm.certificate_arn
}

output "frontend_asg_name" {
  value = module.frontend_asg.asg_name
}

output "backend_asg_name" {
  value = module.backend_asg.asg_name
}

output "sns_topic_arn" {
  value = module.sns.topic_arn
}
