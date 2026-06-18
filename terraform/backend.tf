terraform {
  backend "s3" {
    bucket         = "procurement-tf-state-global"
    key            = "platform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
  }
}
