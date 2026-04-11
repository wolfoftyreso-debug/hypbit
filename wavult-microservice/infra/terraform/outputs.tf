output "ecr_repository_url" {
  value = aws_ecr_repository.service.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.service.name
}

output "alb_dns_name" {
  value = aws_lb.service.dns_name
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.service.name
}
