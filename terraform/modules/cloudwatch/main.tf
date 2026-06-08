resource "aws_cloudwatch_metric_alarm" "backend_cpu" {
  alarm_name          = "procurement-${var.environment}-backend-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alarm when Backend ASG CPU utilization exceeds 70%"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.backend_asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "frontend_cpu" {
  alarm_name          = "procurement-${var.environment}-frontend-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alarm when Frontend ASG CPU utilization exceeds 70%"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.frontend_asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "procurement-${var.environment}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alarm when Public ALB 5XX error count is greater than 5 in 1 minute"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    LoadBalancer = var.public_alb_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "unhealthy_targets_public" {
  alarm_name          = "procurement-${var.environment}-unhealthy-targets-public"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alarm when Public target group has unhealthy hosts"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    LoadBalancer = var.public_alb_arn_suffix
    TargetGroup  = var.public_target_group_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "unhealthy_targets_internal" {
  alarm_name          = "procurement-${var.environment}-unhealthy-targets-internal"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alarm when Internal target group has unhealthy hosts"
  alarm_actions       = [var.sns_topic_arn]
  dimensions = {
    LoadBalancer = var.internal_alb_arn_suffix
    TargetGroup  = var.internal_target_group_arn_suffix
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "procurement-${var.environment}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", var.frontend_asg_name],
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", var.backend_asg_name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "ASG CPU Utilization"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.public_alb_arn_suffix],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.internal_alb_arn_suffix]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "ALB Request Volume"
        }
      }
    ]
  })
}
