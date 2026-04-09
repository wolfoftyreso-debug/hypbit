############################################
# Security groups
############################################

resource "aws_security_group" "alb" {
  name        = "${var.service_name}-alb-sg"
  description = "Allow HTTPS/HTTP to the quixzoom-connector ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.service_name}-alb-sg" }
}

resource "aws_security_group" "service" {
  name        = "${var.service_name}-svc-sg"
  description = "quixzoom-connector Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.service_name}-svc-sg" }
}

resource "aws_security_group" "redis" {
  name        = "${var.service_name}-redis-sg"
  description = "Allow connector tasks to reach Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.service.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.service_name}-redis-sg" }
}

# Grant the connector security group network access to the existing
# MSK cluster security group.
resource "aws_security_group_rule" "msk_ingress_from_connector" {
  type                     = "ingress"
  from_port                = 9092
  to_port                  = 9098
  protocol                 = "tcp"
  security_group_id        = var.kafka_security_group_id
  source_security_group_id = aws_security_group.service.id
  description              = "Allow quixzoom-connector to publish to MSK"
}
