output "ecr_repository_urls" { value = module.ecr.repository_urls }
output "route53_zone_id" { value = module.route53.zone_id }
output "acm_certificate_arn" { value = module.acm.certificate_arn }
output "github_oidc_role_arn" { value = module.github_oidc.role_arn }
