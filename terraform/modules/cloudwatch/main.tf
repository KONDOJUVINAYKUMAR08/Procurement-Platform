# Backend High CPU: CPU > 70% for 2 minutes (2 evaluations of 1-minute period)
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "procurement-${var.environment}-backend-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alarm when Backend ASG CPU utilization exceeds 70% for 2 minutes"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.backend_asg_name
  }
}

# Backend Low CPU: CPU < 30% for 5 minutes (5 evaluations of 1-minute period)
resource "aws_cloudwatch_metric_alarm" "backend_cpu_low" {
  alarm_name          = "procurement-${var.environment}-backend-cpu-low"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Alarm when Backend ASG CPU utilization falls below 30% for 5 minutes"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.backend_asg_name
  }
}

# Frontend High CPU: CPU > 70% for 2 minutes (2 evaluations of 1-minute period)
resource "aws_cloudwatch_metric_alarm" "frontend_cpu_high" {
  alarm_name          = "procurement-${var.environment}-frontend-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "Alarm when Frontend ASG CPU utilization exceeds 70% for 2 minutes"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.frontend_asg_name
  }
}

# Frontend Low CPU: CPU < 30% for 5 minutes (5 evaluations of 1-minute period)
resource "aws_cloudwatch_metric_alarm" "frontend_cpu_low" {
  alarm_name          = "procurement-${var.environment}-frontend-cpu-low"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Alarm when Frontend ASG CPU utilization falls below 30% for 5 minutes"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  dimensions = {
    AutoScalingGroupName = var.frontend_asg_name
  }
}

# ALB 5XX error rate (Sum >= 5 in 1 minute)
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

# Public unhealthy target count (Unhealthy count > 0 for 1 minute)
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

# Internal unhealthy target count (Unhealthy count > 0 for 1 minute)
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

# -----------------------------------------------------------------------------
# EventBridge rule for ASG lifecycle events
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_event_rule" "asg_events" {
  name        = "procurement-${var.environment}-asg-events"
  description = "Capture Auto Scaling instance launch and terminate events"

  event_pattern = jsonencode({
    source      = ["aws.autoscaling"]
    detail-type = [
      "EC2 Instance Launch Successful",
      "EC2 Instance Terminate Successful"
    ]
    detail = {
      AutoScalingGroupName = [
        var.frontend_asg_name,
        var.backend_asg_name
      ]
    }
  })
}

# -----------------------------------------------------------------------------
# EventBridge target mapping to SNS topic
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.asg_events.name
  target_id = "SendToSNS"
  arn       = var.sns_topic_arn
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------
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
