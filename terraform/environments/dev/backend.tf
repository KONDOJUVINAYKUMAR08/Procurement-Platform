terraform {
  backend "s3" {
    bucket               = "rxpulse-terraform-state-08"
    key                  = "terraform.tfstate"
    workspace_key_prefix = "procurement"
    region               = "us-east-1"
    dynamodb_table       = "terraform-locks"
  }
}
