variable "domain_name" {
  type = string
}
variable "subdomain" {
  type = string
}
variable "alb_dns_name" {
  type = string
}
variable "alb_zone_id" {
  type = string
}
variable "internal_alb_dns_name" {
  type = string
}
variable "internal_alb_zone_id" {
  type = string
}
variable "environment" {
  type = string
}
variable "create_apex_records" {
  type    = bool
  default = true
}

