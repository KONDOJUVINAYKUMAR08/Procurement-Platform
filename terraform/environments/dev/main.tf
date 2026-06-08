terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

module "vpc" {
  source = "../../modules/vpc"
  environment = "dev"
  aws_region = var.aws_region
  vpc_cidr = "10.0.0.0/16"
  azs = ["us-east-1a", "us-east-1b"]
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  frontend_private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]
  backend_private_subnets = ["10.0.5.0/24", "10.0.6.0/24"]
}

module "security_groups" {
  source = "../../modules/security-groups"
  vpc_id = module.vpc.vpc_id
  environment = "dev"
}

module "iam" {
  source = "../../modules/iam"
  environment = "dev"
}

module "public_alb" {
  source = "../../modules/alb"
  name = "public-alb"
  environment = "dev"
  vpc_id = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  security_group_id = module.security_groups.public_alb_sg_id
  internal = false
}

module "internal_alb" {
  source = "../../modules/alb"
  name = "internal-alb"
  environment = "dev"
  vpc_id = module.vpc.vpc_id
  subnets = module.vpc.backend_subnets
  security_group_id = module.security_groups.internal_alb_sg_id
  internal = true
}

module "frontend_asg" {
  source = "../../modules/asg"
  name = "frontend-asg"
  environment = "dev"
  vpc_zone_identifier = module.vpc.frontend_subnets
  target_group_arn = module.public_alb.target_group_arn
  security_group_id = module.security_groups.frontend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id = var.frontend_ami_id
  instance_type = "t3.micro"
}

module "backend_asg" {
  source = "../../modules/asg"
  name = "backend-asg"
  environment = "dev"
  vpc_zone_identifier = module.vpc.backend_subnets
  target_group_arn = module.internal_alb.target_group_arn
  security_group_id = module.security_groups.backend_sg_id
  iam_instance_profile = module.iam.instance_profile_name
  ami_id = var.backend_ami_id
  instance_type = "t3.small"
}

variable "frontend_ami_id" {
  type = string
  description = "The custom AMI ID baked for the Frontend"
  default = "ami-placeholder-frontend"
}

variable "backend_ami_id" {
  type = string
  description = "The custom AMI ID baked for the Backend"
  default = "ami-placeholder-backend"
}
