resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "procurement-${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "procurement-${var.environment}-public-${count.index + 1}"
    Tier = "Public"
  }
}

resource "aws_subnet" "frontend" {
  count             = length(var.frontend_private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.frontend_private_subnets[count.index]
  availability_zone = var.azs[count.index]
  tags = {
    Name = "procurement-${var.environment}-frontend-${count.index + 1}"
    Tier = "Frontend"
  }
}

resource "aws_subnet" "backend" {
  count             = length(var.backend_private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.backend_private_subnets[count.index]
  availability_zone = var.azs[count.index]
  tags = {
    Name = "procurement-${var.environment}-backend-${count.index + 1}"
    Tier = "Backend"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "procurement-${var.environment}-igw"
  }
}

resource "aws_eip" "nat" {
  count  = length(var.public_subnets)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = length(var.public_subnets)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = {
    Name = "procurement-${var.environment}-nat-${count.index + 1}"
  }
  depends_on = [aws_internet_gateway.igw]
}

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
  count  = length(var.public_subnets)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
  tags = {
    Name = "procurement-${var.environment}-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "frontend" {
  count          = length(var.frontend_private_subnets)
  subnet_id      = aws_subnet.frontend[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "backend" {
  count          = length(var.backend_private_subnets)
  subnet_id      = aws_subnet.backend[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for rt in aws_route_table.private : rt.id]
  tags = {
    Name = "procurement-${var.environment}-dynamodb-endpoint"
  }
}
