variable "environment" { type = string }
variable "services" { type = list(string) }
variable "kms_key_arn" { type = string }
variable "dynamic_outputs" { type = map(string) }
variable "tags" { type = map(string) }
