locals {
  environment = terraform.workspace
  services    = ["frontend", "identity-service", "procurement-service", "finance-service", "document-service", "ai-service"]
  domain_name = var.domain_name
}

module "vpc" {
  source = "./modules/vpc"
  environment     = local.environment
  vpc_cidr        = var.vpc_cidr
  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  tags            = var.tags
}

module "kms" {
  source = "./modules/kms"
  environment = local.environment
  tags = var.tags
}

module "eks" {
  source = "./modules/eks"
  environment         = local.environment
  vpc_id              = module.vpc.vpc_id
  private_subnets     = module.vpc.private_subnets
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size
  node_instance_types = var.node_instance_types
  tags                = var.tags
}

module "s3" {
  source = "./modules/s3"
  bucket_name = var.s3_bucket_name
  kms_key_arn = module.kms.key_arn
  tags = var.tags
}

module "dynamodb" {
  source = "./modules/dynamodb"
  environment = local.environment
  tables      = var.dynamodb_tables
  kms_key_arn = module.kms.key_arn
  tags        = var.tags
}

module "cognito" {
  source = "./modules/cognito"
  environment = local.environment
  tags = var.tags
}

module "ecr" {
  source = "./modules/ecr"
  environment = local.environment
  services    = local.services
  tags        = var.tags
}

module "secrets_manager" {
  source = "./modules/secrets-manager"
  environment = local.environment
  services    = local.services
  kms_key_arn = module.kms.key_arn
  dynamic_outputs = {
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID    = module.cognito.client_id
    DYNAMODB_TABLES      = jsonencode(module.dynamodb.table_names)
    S3_BUCKET_NAME       = module.s3.bucket_name
  }
  tags = var.tags
}

module "iam_irsa" {
  source = "./modules/iam"
  environment       = local.environment
  services          = local.services
  oidc_provider_arn = module.eks.oidc_provider_arn
  secret_arns       = values(module.secrets_manager.secret_arns)
  dynamodb_tables   = values(module.dynamodb.table_names)
  s3_bucket_arn     = module.s3.bucket_arn
  kms_key_arn       = module.kms.key_arn
}

module "route53" {
  source = "./modules/route53"
  domain_name = local.domain_name
  tags = var.tags
}

module "acm" {
  source = "./modules/acm"
  domain_name = local.domain_name
  zone_id     = module.route53.zone_id
  tags        = var.tags
}

module "cloudwatch" {
  source = "./modules/cloudwatch"
  environment = local.environment
  tags = var.tags
}
