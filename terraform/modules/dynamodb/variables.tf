variable "environment" { type = string }
variable "tables" { type = list(string) }
variable "kms_key_arn" { type = string }
variable "tags" { type = map(string) }
