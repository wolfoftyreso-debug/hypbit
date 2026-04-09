# quixzoom-connector — Deployment

## Prerequisites

- AWS credentials with access to `eu-north-1`
- ECR repository `quixzoom-connector` exists (or is created by the first
  `docker push`)
- Terraform stack in `terraform/` has been applied at least once
- MSK topics created via `terraform/kafka-topics.tf`

## One-time bootstrap

```bash
# Create ECR repository
aws ecr create-repository --repository-name quixzoom-connector --region eu-north-1

# Apply infra
cd apps/quixzoom-connector/terraform
terraform init
terraform apply \
  -var="container_image=155407238699.dkr.ecr.eu-north-1.amazonaws.com/quixzoom-connector:latest" \
  -var="msk_cluster_arn=<MSK_ARN>" \
  -var="msk_bootstrap_brokers=<BROKER_LIST>" \
  -var="kafka_security_group_id=<MSK_SG>"
```

## Build and push

```bash
cd apps/quixzoom-connector
docker build -t quixzoom-connector .
docker tag quixzoom-connector:latest 155407238699.dkr.ecr.eu-north-1.amazonaws.com/quixzoom-connector:latest
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin 155407238699.dkr.ecr.eu-north-1.amazonaws.com
docker push 155407238699.dkr.ecr.eu-north-1.amazonaws.com/quixzoom-connector:latest
```

## Deploy

```bash
aws ecs update-service \
  --cluster quixzoom-connector \
  --service quixzoom-connector \
  --force-new-deployment \
  --region eu-north-1
aws ecs wait services-stable \
  --cluster quixzoom-connector \
  --services quixzoom-connector \
  --region eu-north-1
```

## Verify

```bash
ALB=$(aws elbv2 describe-load-balancers \
  --names quixzoom-connector-alb \
  --query 'LoadBalancers[0].DNSName' --output text --region eu-north-1)

curl -sf http://$ALB/health    # {"status":"ok"}
curl -s http://$ALB/ready      # expected: {"status":"ready","checks":{"redis":true,"kafka":true}}

curl -s -X POST http://$ALB/llm/query \
  -H 'Content-Type: application/json' \
  -d '{"text":"Visa hur det ser ut i Stockholm nu"}'
```

## CI/CD

`.gitea/workflows/deploy-quixzoom-connector.yml` runs automatically on
pushes to `main` that touch `apps/quixzoom-connector/**`. Pipeline:

1. `test` — `npm ci`, `npm run lint`, `npm test`, `npm run build`
2. `deploy` — ECR login, build, tag (SHA + latest), push, ECS
   `update-service --force-new-deployment`, `wait services-stable`,
   `/health` smoke test against the ALB

## Register in Wavult OS

After the first deploy, register the service with Wavult OS so the
command-center and infrastructure-health monitors pick it up:

```bash
cd apps/wavult-core
npm run register-service -- \
  --name quixzoom-connector \
  --tier critical \
  --region eu-north-1 \
  --alb quixzoom-connector-alb \
  --topic quixzoom.tasks.created
```
