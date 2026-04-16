# Terraform — Wavult Geopol AWS scaffold

This is a starting point, not a finished deploy. The modules for MSK, Neo4j,
Redis and OpenSearch are commented out — wire them in as you go.

```bash
cd infra/terraform
terraform init
terraform plan -var environment=dev
```
