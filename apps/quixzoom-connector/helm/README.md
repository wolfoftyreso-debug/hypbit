# quixzoom-connector Helm chart

Reference deployment for Kubernetes clusters. Companion to the
Terraform ECS stack for teams that prefer Kubernetes.

## Install

```bash
helm install quixzoom apps/quixzoom-connector/helm \
  --namespace quixzoom --create-namespace \
  --set image.tag=v0.1.0 \
  --set env.query_engine=cached-shadow
```

## Features

- 3 replicas minimum with HPA 3..20 on CPU/memory
- PodDisruptionBudget minAvailable=2 so rolling updates never bring
  the service below 2 pods
- Prometheus ServiceMonitor and scrape annotations
- NetworkPolicy allowing only ingress-nginx inbound and egress to
  DNS + HTTPS + Redis/Kafka ports
- Secrets expected from external-secrets-operator pulling SSM
- ReadOnlyRootFilesystem, non-root, drop-all capabilities
- Graceful preStop sleep so in-flight SSE streams finish cleanly

## Values

See `values.yaml` for the full override surface. Most deployments
only need to change `image.tag` and the engine selector.
