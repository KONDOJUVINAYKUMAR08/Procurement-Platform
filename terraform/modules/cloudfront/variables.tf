variable "environment" {
  type        = string
  description = "Target deployment environment"
}

variable "domain_name" {
  type        = string
  description = "Apex domain name (e.g. rxpulse.online)"
}

variable "subdomain" {
  type        = string
  description = "Procurement subdomain prefix"
}

variable "origin_dns_name" {
  type        = string
  description = "Public Application Load Balancer DNS name"
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN created in us-east-1"
}

variable "waf_web_acl_arn" {
  type        = string
  description = "WAF Web ACL ARN for CloudFront scope"
}
