module "vpc" {
  source                   = "../../modules/networking"
  environment              = "dev"
  aws_region               = var.aws_region
  vpc_cidr                 = "10.0.0.0/16"
  azs                      = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets           = ["10.0.1.0/24", "10.0.2.0/24"]
  frontend_private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]
  backend_private_subnets  = ["10.0.5.0/24", "10.0.6.0/24"]
}

module "security_groups" {
  source      = "../../modules/security-groups"
  vpc_id      = module.vpc.vpc_id
  environment = "dev"
}

module "iam" {
  source         = "../../modules/iam"
  environment    = "dev"
  s3_bucket_name = var.s3_bucket_name
  kms_key_arn    = aws_kms_key.procurement_key.arn
}

module "route53" {
  source                = "../../modules/route53"
  domain_name           = var.domain_name
  subdomain             = var.subdomain
  alb_dns_name          = module.public_alb.alb_dns_name
  alb_zone_id           = module.public_alb.zone_id
  internal_alb_dns_name = module.internal_alb.alb_dns_name
  internal_alb_zone_id  = module.internal_alb.zone_id
}

module "acm" {
  source          = "../../modules/acm"
  domain_name     = var.domain_name
  subdomain       = var.subdomain
  route53_zone_id = module.route53.zone_id
}

module "waf" {
  source      = "../../modules/waf"
  environment = "dev"
}

module "public_alb" {
  source            = "../../modules/alb"
  name              = "public-alb"
  environment       = "dev"
  vpc_id            = module.vpc.vpc_id
  subnets           = module.vpc.public_subnets
  security_group_id = module.security_groups.public_alb_sg_id
  internal          = false
  enable_https      = true
  certificate_arn   = module.acm.certificate_arn
  enable_waf        = true
  waf_web_acl_arn   = module.waf.web_acl_arn
}

module "internal_alb" {
  source            = "../../modules/alb"
  name              = "internal-alb"
  environment       = "dev"
  vpc_id            = module.vpc.vpc_id
  subnets           = module.vpc.backend_subnets
  security_group_id = module.security_groups.internal_alb_sg_id
  internal          = true
  enable_https      = false
  enable_waf        = false
}

module "frontend_asg" {
  source               = "../../modules/asg"
  name                 = "frontend-asg"
  environment          = "dev"
  vpc_zone_identifier  = module.vpc.frontend_subnets
  target_group_arn     = module.public_alb.target_group_arn
  security_group_id    = module.security_groups.frontend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id               = var.frontend_ami_id
  instance_type        = "t3.small"
}

module "backend_asg" {
  source               = "../../modules/asg"
  name                 = "backend-asg"
  environment          = "dev"
  vpc_zone_identifier  = module.vpc.backend_subnets
  target_group_arn     = module.internal_alb.target_group_arn
  security_group_id    = module.security_groups.backend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id               = var.backend_ami_id
  instance_type        = "t3.small"
}



module "sns" {
  source        = "../../modules/sns"
  environment   = "dev"
  email_address = var.alert_email
}

module "cloudwatch" {
  source                           = "../../modules/cloudwatch"
  environment                      = "dev"
  sns_topic_arn                    = module.sns.topic_arn
  frontend_asg_name                = module.frontend_asg.asg_name
  backend_asg_name                 = module.backend_asg.asg_name
  public_alb_arn_suffix            = module.public_alb.alb_arn_suffix
  internal_alb_arn_suffix          = module.internal_alb.alb_arn_suffix
  public_target_group_arn_suffix   = module.public_alb.target_group_arn_suffix
  internal_target_group_arn_suffix = module.internal_alb.target_group_arn_suffix
}

# module "cloudtrail" {
#   source      = "../../modules/cloudtrail"
#   environment = "dev"
# }

# module "config" {
#   source      = "../../modules/config"
#   environment = "dev"
# }
