resource "aws_security_group" "redis" {
  name_prefix = "amos-redis-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

resource "aws_elasticache_subnet_group" "amos" {
  name       = "amos-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_replication_group" "amos" {
  replication_group_id       = "amos-${var.environment}"
  description                = "Amos identity platform cache"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.environment == "prod" ? "cache.t4g.small" : "cache.t4g.micro"
  num_cache_clusters         = var.environment == "prod" ? 2 : 1
  automatic_failover_enabled = var.environment == "prod"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.amos.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
