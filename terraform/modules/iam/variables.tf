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
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "bedrock_model_arns" {
  description = "Bedrock foundation-model ARNs the AI service is allowed to invoke. Defaults to the Nova Pro text model and the Nova multimodal embedding model in the given region."
  type        = list(string)
  default     = []
}
