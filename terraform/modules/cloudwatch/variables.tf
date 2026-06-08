variable "environment" {
  type = string
}
variable "sns_topic_arn" {
  type = string
}
variable "frontend_asg_name" {
  type = string
}
variable "backend_asg_name" {
  type = string
}
variable "public_alb_arn_suffix" {
  type = string
}
variable "internal_alb_arn_suffix" {
  type = string
}
variable "public_target_group_arn_suffix" {
  type = string
}
variable "internal_target_group_arn_suffix" {
  type = string
}
