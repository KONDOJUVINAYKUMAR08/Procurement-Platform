provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = local.environment
      Project     = "Procurement-Platform"
      ManagedBy   = "Terraform"
    }
  }
}
