output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.main.id
  description = "The ID of the CloudFront distribution"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "The domain name of the CloudFront distribution"
}

output "cloudfront_hosted_zone_id" {
  value       = aws_cloudfront_distribution.main.hosted_zone_id
  description = "The hosted zone ID of the CloudFront distribution (always Z2FDTNDATAQYW2)"
}
