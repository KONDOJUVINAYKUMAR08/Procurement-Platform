data "aws_route53_zone" "primary" {
  count = var.environment != "dev" ? 1 : 0
  name  = var.domain_name
}

resource "aws_route53_zone" "primary" {
  count = var.environment == "dev" ? 1 : 0
  name  = var.domain_name
}

locals {
  route53_zone_id = var.environment == "dev" ? aws_route53_zone.primary[0].zone_id : data.aws_route53_zone.primary[0].zone_id
}

resource "aws_route53_record" "alb" {
  zone_id = local.route53_zone_id
  name    = "${var.subdomain}.${var.domain_name}"
  type    = "A"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "apex" {
  count   = var.create_apex_records ? 1 : 0
  zone_id = local.route53_zone_id
  name    = var.domain_name
  type    = "A"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  count   = var.create_apex_records ? 1 : 0
  zone_id = local.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}



