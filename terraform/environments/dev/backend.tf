terraform {
  backend "s3" {
    bucket         = "procurement-tf-state-global"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
  }
}
