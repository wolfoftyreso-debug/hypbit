############################################
# ElastiCache — Redis 7, single cache.t3.micro node in the private subnets.
############################################

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.service_name}-redis-subnets"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.service_name}-redis"
  description                = "Hot cache + pub/sub for quixzoom-connector"
  node_type                  = "cache.t3.micro"
  engine                     = "redis"
  engine_version             = "7.1"
  num_cache_clusters         = 1
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

output "redis_primary_endpoint" {
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "Primary endpoint of the connector Redis cluster"
}
