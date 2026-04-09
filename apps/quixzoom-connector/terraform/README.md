# quixzoom-connector — Terraform

Region: `eu-north-1`.

## Modules included

- `versions.tf` — provider and remote state (S3 backend)
- `variables.tf` — all inputs
- `vpc.tf` — 10.0.0.0/16 with public + private subnets and a NAT gateway
- `security.tf` — ALB, service, Redis, and MSK-ingress rules
- `redis.tf` — ElastiCache Redis 7, cache.t3.micro, transit + at-rest TLS
- `alb.tf` — Application Load Balancer with `/health` target group
- `ecs.tf` — Fargate cluster, IAM roles, task definition, service
- `kafka-topics.tf` — Kafka topics on the existing MSK cluster

## Usage

```bash
cd apps/quixzoom-connector/terraform
terraform init
terraform plan \
  -var="container_image=<ECR_URI>:<tag>" \
  -var="msk_cluster_arn=<MSK_ARN>" \
  -var="msk_bootstrap_brokers=<b1:9098,b2:9098,b3:9098>" \
  -var="kafka_security_group_id=<SG_ID>"
terraform apply
```

## Outputs

- `alb_dns_name` — public endpoint for the ALB
- `redis_primary_endpoint` — private Redis endpoint (for debugging)

## Notes

- `aws_ecs_service.connector` ignores changes to `task_definition` so
  the CI/CD pipeline (Phase 8) can roll forward with
  `aws ecs update-service --force-new-deployment`.
- The Kafka topic resources assume IAM auth against MSK. Run terraform
  from a role that has `kafka-cluster:AlterTopic`.
