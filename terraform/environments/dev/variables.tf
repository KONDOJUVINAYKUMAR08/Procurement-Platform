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

variable "users_table_name" {
  type    = string
  default = "procurement-dev-users"
}

variable "vendors_table_name" {
  type    = string
  default = "procurement-dev-vendors"
}

variable "contracts_table_name" {
  type    = string
  default = "procurement-dev-contracts"
}

variable "purchase_orders_table_name" {
  type    = string
  default = "procurement-dev-purchase-orders"
}

variable "invoices_table_name" {
  type    = string
  default = "procurement-dev-invoices"
}

variable "documents_table_name" {
  type    = string
  default = "procurement-dev-documents"
}

