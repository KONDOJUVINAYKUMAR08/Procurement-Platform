output "zone_id" {
  value = data.aws_route53_zone.primary.zone_id
}
output "fqdn" {
  value = "${var.subdomain}.${var.domain_name}"
}
