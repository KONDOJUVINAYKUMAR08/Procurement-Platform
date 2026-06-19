locals {
  environment = "prod"
  services    = ["frontend", "identity-service", "procurement-service", "finance-service", "document-service", "ai-service"]

  dynamodb_tables = {
    "Identity_User" = [{ index_name = "emailIndex", attribute_name = "email" }]
    "HR_Employee" = [
      { index_name = "employeeIdIndex", attribute_name = "employeeId" },
      { index_name = "employeeEmailIndex", attribute_name = "email" },
      { index_name = "employeeStatusIndex", attribute_name = "status" },
    ]
    "HR_Attendance" = [
      { index_name = "attendanceEmployeeIndex", attribute_name = "employeeId" },
      { index_name = "attendanceDateIndex", attribute_name = "date" },
    ]
    "HR_Payslip" = [
      { index_name = "payslipNumberIndex", attribute_name = "payslipNumber" },
      { index_name = "payslipEmployeeIndex", attribute_name = "employeeId" },
      { index_name = "payslipStatusIndex", attribute_name = "status" },
    ]
    "HR_Letter" = [
      { index_name = "letterNumberIndex", attribute_name = "letterNumber" },
      { index_name = "letterTypeIndex", attribute_name = "letterType" },
      { index_name = "letterEmployeeIndex", attribute_name = "employeeId" },
      { index_name = "letterStatusIndex", attribute_name = "status" },
    ]
    "Procurement_Vendor" = [
      { index_name = "vendorCodeIndex", attribute_name = "vendorCode" },
      { index_name = "vendorEmailIndex", attribute_name = "email" },
    ]
    "Procurement_PurchaseRequest" = [
      { index_name = "prVendorIndex", attribute_name = "vendor" },
      { index_name = "prStatusIndex", attribute_name = "status" },
      { index_name = "prRequestedByIndex", attribute_name = "requestedBy" },
    ]
    "Procurement_PurchaseOrder" = [
      { index_name = "poNumberIndex", attribute_name = "poNumber" },
      { index_name = "poVendorIndex", attribute_name = "vendor" },
      { index_name = "poStatusIndex", attribute_name = "status" },
    ]
    "Procurement_Contract" = [
      { index_name = "contractVendorIndex", attribute_name = "vendor" },
      { index_name = "contractNumberIndex", attribute_name = "contractNumber" },
      { index_name = "contractStatusIndex", attribute_name = "status" },
    ]
    "Finance_Invoice" = [
      { index_name = "invoiceNumberIndex", attribute_name = "invoiceNumber" },
      { index_name = "invoiceTypeIndex", attribute_name = "invoiceType" },
      { index_name = "invoiceStatusIndex", attribute_name = "status" },
      { index_name = "invoiceCreatedByIndex", attribute_name = "createdBy" },
    ]
    "Finance_Payment" = [
      { index_name = "paymentRefIndex", attribute_name = "paymentReference" },
      { index_name = "paymentInvoiceIndex", attribute_name = "invoice" },
      { index_name = "paymentVendorIndex", attribute_name = "vendor" },
      { index_name = "paymentStatusIndex", attribute_name = "status" },
    ]
    "Finance_Customer" = [
      { index_name = "customerCodeIndex", attribute_name = "customerCode" },
      { index_name = "customerEmailIndex", attribute_name = "email" },
      { index_name = "customerStatusIndex", attribute_name = "status" },
    ]
    "Document_Document" = [
      { index_name = "documentCategoryIndex", attribute_name = "category" },
      { index_name = "documentRelatedIdIndex", attribute_name = "relatedId" },
    ]
    "Document_AuditLog" = [
      { index_name = "auditUserIdIndex", attribute_name = "userId" },
      { index_name = "auditEntityIndex", attribute_name = "entity" },
    ]
    "Document_Notification" = [
      { index_name = "notificationUserIdIndex", attribute_name = "userId" },
    ]
    "AI_ContractAnalysis" = [
      { index_name = "contractAnalysisDocumentIdIndex", attribute_name = "documentId" },
      { index_name = "contractAnalysisStatusIndex", attribute_name = "status" },
    ]
    "AI_Embedding" = [
      { index_name = "embeddingDocumentIdIndex", attribute_name = "documentId" },
      { index_name = "embeddingCategoryIndex", attribute_name = "category" },
      { index_name = "embeddingRelatedIdIndex", attribute_name = "relatedId" },
      { index_name = "embeddingOwnerVendorIndex", attribute_name = "ownerVendorId" },
    ]
    "AI_InvoiceAnalysis" = [
      { index_name = "invoiceAnalysisInvoiceIdIndex", attribute_name = "invoiceId" },
      { index_name = "invoiceAnalysisRiskLevelIndex", attribute_name = "riskLevel" },
    ]
    "AI_Feedback" = [
      { index_name = "feedbackFeatureIndex", attribute_name = "feature" },
      { index_name = "feedbackReferenceIdIndex", attribute_name = "referenceId" },
      { index_name = "feedbackUserIdIndex", attribute_name = "userId" },
    ]
  }
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = false
}

module "vpc" {
  source          = "../../modules/vpc"
  environment     = local.environment
  vpc_cidr        = var.vpc_cidr
  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  tags            = var.tags
}

module "kms" {
  source      = "../../modules/kms"
  environment = local.environment
  tags        = var.tags
}

module "eks" {
  source              = "../../modules/eks"
  environment         = local.environment
  vpc_id              = module.vpc.vpc_id
  private_subnets     = module.vpc.private_subnets
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size
  node_instance_types = var.node_instance_types
  tags                = var.tags
}

module "s3" {
  source      = "../../modules/s3"
  bucket_name = var.s3_bucket_name
  kms_key_arn = module.kms.key_arn
  tags        = var.tags
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  environment = local.environment
  tables      = local.dynamodb_tables
  kms_key_arn = module.kms.key_arn
  tags        = var.tags
}

module "cognito" {
  source      = "../../modules/cognito"
  environment = local.environment
  tags        = var.tags
}

module "secrets_manager" {
  source      = "../../modules/secrets-manager"
  environment = local.environment
  services    = local.services
  kms_key_arn = module.kms.key_arn

  # Every key here must exactly match what backend/shared/common/src/config/
  # secrets.ts's updateConfig() reads — anything else is silently ignored by
  # the app. This is the fix for the gap found during this migration: the
  # original scaffold only passed Cognito/DynamoDB/S3 metadata, never the
  # actual JWT secrets or AWS/Bedrock config the app needs to boot correctly.
  dynamic_outputs = {
    AWS_REGION                     = var.aws_region
    AWS_S3_BUCKET                  = module.s3.bucket_name
    AWS_KMS_KEY_ID                 = module.kms.key_arn
    JWT_SECRET                     = random_password.jwt_secret.result
    JWT_REFRESH_SECRET             = random_password.jwt_refresh_secret.result
    JWT_EXPIRY                     = "15m"
    JWT_REFRESH_EXPIRY             = "7d"
    CORS_ORIGIN                    = "https://${var.app_hostname}"
    AWS_BEDROCK_REGION             = var.aws_region
    AWS_BEDROCK_TEXT_MODEL_ID      = var.bedrock_text_model_id
    AWS_BEDROCK_EMBEDDING_MODEL_ID = var.bedrock_embedding_model_id
    COGNITO_USER_POOL_ID           = module.cognito.user_pool_id
    COGNITO_CLIENT_ID              = module.cognito.client_id
    DYNAMODB_TABLES                = jsonencode(module.dynamodb.table_names)
    S3_BUCKET_NAME                 = module.s3.bucket_name
  }

  tags = var.tags
}

module "iam_irsa" {
  source                     = "../../modules/iam"
  environment                = local.environment
  services                   = local.services
  oidc_provider_arn          = module.eks.oidc_provider_arn
  secret_arns                = values(module.secrets_manager.secret_arns)
  dynamodb_tables            = values(module.dynamodb.table_names)
  s3_bucket_arn              = module.s3.bucket_arn
  kms_key_arn                = module.kms.key_arn
  aws_region                 = var.aws_region
  bedrock_text_model_id      = var.bedrock_text_model_id
  bedrock_embedding_model_id = var.bedrock_embedding_model_id
}

module "sns" {
  source          = "../../modules/sns"
  environment     = local.environment
  sender_email    = var.sns_sender_email
  recipient_email = var.sns_recipient_email
}

module "cloudwatch" {
  source               = "../../modules/cloudwatch"
  environment          = local.environment
  services             = local.services
  sns_topic_arn        = module.sns.topic_arn
  dynamodb_table_names = values(module.dynamodb.table_names)
  eks_cluster_name     = module.eks.cluster_name
  tags                 = var.tags
}

module "waf" {
  source      = "../../modules/waf"
  environment = local.environment
}
