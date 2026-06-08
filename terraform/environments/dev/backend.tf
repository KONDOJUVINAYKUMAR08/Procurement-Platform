terraform {
  backend "s3" {
    bucket         = "rxpulse-terraform-state"
    key            = "procurement/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
