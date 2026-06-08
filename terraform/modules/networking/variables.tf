variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}
variable "environment" {
  type = string
}
variable "azs" {
  type = list(string)
}
variable "public_subnets" {
  type = list(string)
}
variable "frontend_private_subnets" {
  type = list(string)
}
variable "backend_private_subnets" {
  type = list(string)
}
variable "aws_region" {
  type = string
}
