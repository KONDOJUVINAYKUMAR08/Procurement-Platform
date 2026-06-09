variable "domain_name" {
  type        = string
  description = "Apex domain name"
}

variable "subdomain" {
  type        = string
  description = "Subdomain prefix"
}

variable "cloudfront_domain_name" {
  type        = string
  description = "Domain name of the CloudFront distribution"
}

variable "cloudfront_zone_id" {
  type        = string
  description = "Hosted zone ID of the CloudFront distribution"
}
