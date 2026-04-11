output "alb_dns_name" {
  value = aws_lb.identity.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.amos.endpoint
}

output "redis_primary_endpoint" {
  value = aws_elasticache_replication_group.amos.primary_endpoint_address
}

output "s3_bucket" {
  value = aws_s3_bucket.identity.id
}

output "ecr_repositories" {
  value = { for k, v in aws_ecr_repository.service : k => v.repository_url }
}
