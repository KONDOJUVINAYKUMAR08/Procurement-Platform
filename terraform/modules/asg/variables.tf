variable "name" {
  type = string
}
variable "environment" {
  type = string
}
variable "vpc_zone_identifier" {
  type = list(string)
}
variable "target_group_arn" {
  type = string
}
variable "security_group_id" {
  type = string
}
variable "iam_instance_profile" {
  type = string
}
variable "ami_id" {
  type = string
}
variable "instance_type" {
  type    = string
  default = "t3.micro"
}
