variable "environment" {
  type = string
}
variable "s3_bucket_name" {
  type = string
}
variable "kms_key_arn" {
  type    = string
  default = ""
}
