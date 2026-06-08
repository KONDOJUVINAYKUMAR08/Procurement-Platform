variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "frontend_ami_id" {
  type = string
}

variable "backend_ami_id" {
  type = string
}

variable "s3_bucket_name" {
  type = string
}

variable "domain_name" {
  type    = string
  default = "rxpulse.online"
}

variable "subdomain" {
  type    = string
  default = "procurement"
}

variable "alert_email" {
  type = string
}
