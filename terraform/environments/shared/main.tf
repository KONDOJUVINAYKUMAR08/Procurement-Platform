locals {
  services = ["frontend", "identity-service", "procurement-service", "finance-service", "document-service", "ai-service"]
}

module "ecr" {
  source   = "../../modules/ecr"
  services = local.services
  tags     = var.tags
}

module "route53" {
  source      = "../../modules/route53"
  domain_name = var.domain_name
  tags        = var.tags
}

module "acm" {
  source      = "../../modules/acm"
  domain_name = var.domain_name
  zone_id     = module.route53.zone_id
  tags        = var.tags
}

module "github_oidc" {
  source      = "../../modules/github-oidc"
  github_repo = var.github_repo
  tags        = var.tags
}
