output "zone_id" {
  value = aws_route53_zone.primary.zone_id
}
output "name_servers" {
  value = aws_route53_zone.primary.name_servers
}
output "fqdn" {
  value = "${var.subdomain}.${var.domain_name}"
}
