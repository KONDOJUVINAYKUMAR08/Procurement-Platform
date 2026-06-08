variable "name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_zone_identifier" {
  type = list(string)
}

variable "target_group_arn" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "iam_instance_profile" {
  type = string
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type = string
  default = "t3.micro"
}

resource "aws_launch_template" "main" {
  name_prefix   = "procurement-${var.environment}-${var.name}-lt"
  image_id      = var.ami_id
  instance_type = var.instance_type

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

  # Example User Data if you want to pull updates on boot (optional)
  # user_data = filebase64("${path.module}/init.sh")
}

resource "aws_autoscaling_group" "main" {
  name                = "procurement-${var.environment}-${var.name}-asg"
  vpc_zone_identifier = var.vpc_zone_identifier
  desired_capacity    = 2
  max_size            = 4
  min_size            = 2

  target_group_arns = [var.target_group_arn]

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
