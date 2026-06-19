aws_region          = "us-east-1"
vpc_cidr            = "10.1.0.0/16"
azs                 = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnets     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnets      = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
node_min_size       = 2
node_max_size       = 6
node_desired_size   = 3
node_instance_types = ["t3.large"]
s3_bucket_name      = "procurement-documents-prod-08"
app_hostname        = "procurement.rxpulse.online"

bedrock_text_model_id      = "amazon.nova-pro-v1:0"
bedrock_embedding_model_id = "amazon.nova-2-multimodal-embeddings-v1:0"

sns_sender_email    = "alerts@rxpulse.online"
sns_recipient_email = "admin@rxpulse.online"

tags = {
  Environment = "prod"
  Project     = "Procurement-Platform"
  ManagedBy   = "Terraform"
}
