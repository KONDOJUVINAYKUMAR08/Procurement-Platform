output "asg_name" {
  value = aws_autoscaling_group.main.name
}
output "asg_arn" {
  value = aws_autoscaling_group.main.arn
}
output "policy_arn" {
  value = var.target_cpu_utilization != null ? aws_autoscaling_policy.cpu_tracking[0].arn : null
}
