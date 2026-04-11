resource "aws_db_subnet_group" "amos" {
  name       = "amos-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name_prefix = "amos-rds-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "amos" {
  identifier              = "amos-${var.environment}"
  engine                  = "postgres"
  engine_version          = "16.3"
  instance_class          = var.environment == "prod" ? "db.t4g.medium" : "db.t4g.micro"
  allocated_storage       = 50
  max_allocated_storage   = 200
  storage_encrypted       = true
  db_name                 = "amos"
  username                = "amos"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.amos.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "prod"
  deletion_protection     = var.environment == "prod"
  multi_az                = var.environment == "prod"
  apply_immediately       = false
}
