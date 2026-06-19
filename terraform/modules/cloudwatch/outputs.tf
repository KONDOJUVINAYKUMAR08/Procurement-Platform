output "log_group_arn" { value = aws_cloudwatch_log_group.eks.arn }
output "service_log_group_arns" {
  value = { for k, v in aws_cloudwatch_log_group.service : k => v.arn }
}
