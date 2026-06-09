resource "aws_launch_template" "main" {
  name_prefix   = "procurement-${var.environment}-${var.name}-lt"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = "vinay3"
  iam_instance_profile {
    name = var.iam_instance_profile
  }
  vpc_security_group_ids = [var.security_group_id]
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "procurement-${var.environment}-${var.name}-instance"
      Environment = var.environment
    }
  }
}

resource "aws_autoscaling_group" "main" {
  name                = "procurement-${var.environment}-${var.name}-asg"
  vpc_zone_identifier = var.vpc_zone_identifier
  desired_capacity    = var.desired_capacity
  max_size            = var.max_size
  min_size            = var.min_size
  target_group_arns   = [var.target_group_arn]
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  tag {
    key                 = "Name"
    value               = "procurement-${var.environment}-${var.name}-asg"
    propagate_at_launch = true
  }
}
