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

variable "desired_capacity" {
  type    = number
  default = 2
}

variable "min_size" {
  type    = number
  default = 2
}
variable "max_size" {
  type    = number
  default = 3
}

variable "user_data" {
  type    = string
  default = null
}

