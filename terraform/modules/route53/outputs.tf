output "zone_id" {
  value = local.route53_zone_id
}
output "name_servers" {
  value = var.environment == "dev" ? aws_route53_zone.primary[0].name_servers : data.aws_route53_zone.primary[0].name_servers
}
output "fqdn" {
  value = "${var.subdomain}.${var.domain_name}"
}
