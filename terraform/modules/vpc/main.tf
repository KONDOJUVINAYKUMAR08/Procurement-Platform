variable "vpc_cidr" {
  type = string
  default = "10.0.0.0/16"
}
variable "environment" {
  type = string
}
variable "azs" {
  type = list(string)
}
variable "public_subnets" {
  type = list(string)
}
variable "frontend_private_subnets" {
  type = list(string)
}
variable "backend_private_subnets" {
  type = list(string)
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support = true
  tags = {
    Name = "procurement-${var.environment}-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = var.public_subnets[count.index]
  availability_zone = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "procurement-${var.environment}-public-${count.index + 1}"
    Tier = "Public"
  }
}

# Private Frontend Subnets
resource "aws_subnet" "frontend" {
  count = length(var.frontend_private_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = var.frontend_private_subnets[count.index]
  availability_zone = var.azs[count.index]
  tags = {
    Name = "procurement-${var.environment}-frontend-${count.index + 1}"
    Tier = "Frontend"
  }
}

# Private Backend Subnets
resource "aws_subnet" "backend" {
  count = length(var.backend_private_subnets)
  vpc_id = aws_vpc.main.id
  cidr_block = var.backend_private_subnets[count.index]
  availability_zone = var.azs[count.index]
  tags = {
    Name = "procurement-${var.environment}-backend-${count.index + 1}"
    Tier = "Backend"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "procurement-${var.environment}-igw"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnets)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count = length(var.public_subnets)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id = aws_subnet.public[count.index].id
  tags = {
    Name = "procurement-${var.environment}-nat-${count.index + 1}"
  }
  depends_on = [aws_internet_gateway.igw]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "procurement-${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = length(var.public_subnets)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
  tags = {
    Name = "procurement-${var.environment}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)
  subnet_id = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate Private RTs with Frontend Subnets
resource "aws_route_table_association" "frontend" {
  count = length(var.frontend_private_subnets)
  subnet_id = aws_subnet.frontend[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Associate Private RTs with Backend Subnets
resource "aws_route_table_association" "backend" {
  count = length(var.backend_private_subnets)
  subnet_id = aws_subnet.backend[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DynamoDB VPC Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = [for rt in aws_route_table.private : rt.id]
  tags = {
    Name = "procurement-${var.environment}-dynamodb-endpoint"
  }
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public[*].id
}

output "frontend_subnets" {
  value = aws_subnet.frontend[*].id
}

output "backend_subnets" {
  value = aws_subnet.backend[*].id
}

variable "aws_region" {
  type = string
}
