variable "name" {
  type = string
}
variable "environment" {
  type = string
}
variable "vpc_id" {
  type = string
}
variable "subnets" {
  type = list(string)
}
variable "security_group_id" {
  type = string
}
variable "internal" {
  type    = bool
  default = false
}
variable "certificate_arn" {
  type    = string
  default = ""
}
variable "waf_web_acl_arn" {
  type    = string
  default = ""
}

variable "enable_https" {
  type    = bool
  default = false
}

variable "enable_waf" {
  type    = bool
  default = false
}

