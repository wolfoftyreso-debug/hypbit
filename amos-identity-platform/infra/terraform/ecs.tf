resource "aws_ecs_cluster" "amos" {
  name = "amos-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "amos-ecs-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3010
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "task_execution" {
  name = "amos-task-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task" {
  name = "amos-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "task" {
  name = "amos-task-${var.environment}"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.identity.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:Connect",
          "kafka-cluster:*Topic*",
          "kafka-cluster:WriteData",
          "kafka-cluster:ReadData",
          "kafka-cluster:AlterGroup",
          "kafka-cluster:DescribeGroup",
        ]
        Resource = aws_msk_cluster.amos.arn
      }
    ]
  })
}

resource "aws_ecr_repository" "service" {
  for_each             = var.services
  name                 = "amos/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_cloudwatch_log_group" "service" {
  for_each          = var.services
  name              = "/ecs/amos-${each.key}-${var.environment}"
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = var.services
  family                   = "amos-${each.key}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = "${aws_ecr_repository.service[each.key].repository_url}:${var.image_tag}"
    essential = true
    portMappings = [{
      containerPort = each.value
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV",       value = var.environment },
      { name = "POSTGRES_HOST",  value = aws_db_instance.amos.address },
      { name = "POSTGRES_PORT",  value = tostring(aws_db_instance.amos.port) },
      { name = "POSTGRES_DB",    value = aws_db_instance.amos.db_name },
      { name = "POSTGRES_USER",  value = aws_db_instance.amos.username },
      { name = "REDIS_HOST",     value = aws_elasticache_replication_group.amos.primary_endpoint_address },
      { name = "KAFKA_BROKERS",  value = aws_msk_cluster.amos.bootstrap_brokers_tls },
      { name = "S3_BUCKET",      value = aws_s3_bucket.identity.id },
      { name = "S3_REGION",      value = var.aws_region },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.service[each.key].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "wget -q -O- http://localhost:${each.value}/health/live || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

resource "aws_ecs_service" "service" {
  for_each        = var.services
  name            = "amos-${each.key}-${var.environment}"
  cluster         = aws_ecs_cluster.amos.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  desired_count   = var.environment == "prod" ? 2 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = each.key == "identity-service" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.identity[0].arn
      container_name   = each.key
      container_port   = each.value
    }
  }
}
