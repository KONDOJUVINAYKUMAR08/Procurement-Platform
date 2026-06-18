resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.environment}-eks/cluster"
  retention_in_days = 30
  tags              = var.tags
}
