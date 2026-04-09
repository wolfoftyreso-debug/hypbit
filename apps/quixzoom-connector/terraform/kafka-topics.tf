############################################
# Kafka topics on the existing MSK cluster.
# The kafka provider is configured here using the same bootstrap brokers
# the service uses. Authentication relies on IAM auth at apply time.
############################################

terraform {
  required_providers {
    kafka = {
      source  = "Mongey/kafka"
      version = "~> 0.7"
    }
  }
}

provider "kafka" {
  bootstrap_servers = split(",", var.msk_bootstrap_brokers)
  tls_enabled       = true
  sasl_mechanism    = "aws-iam"
  sasl_aws_region   = var.region
}

locals {
  connector_topics = {
    "quixzoom.tasks.created"     = { partitions = 6, replication = 3 }
    "quixzoom.tasks.assigned"    = { partitions = 6, replication = 3 }
    "quixzoom.tasks.captured"    = { partitions = 6, replication = 3 }
    "quixzoom.tasks.validated"   = { partitions = 6, replication = 3 }
    "quixzoom.tasks.failed"      = { partitions = 6, replication = 3 }
    "quixzoom.tokens.transactions" = { partitions = 3, replication = 3 }
    "quixzoom.platform.callbacks"  = { partitions = 3, replication = 3 }
    "quixzoom.dead-letter"         = { partitions = 3, replication = 3 }
  }
}

resource "kafka_topic" "connector" {
  for_each           = local.connector_topics
  name               = each.key
  partitions         = each.value.partitions
  replication_factor = each.value.replication

  config = {
    "cleanup.policy"  = "delete"
    "retention.ms"    = "604800000" # 7 days
    "compression.type" = "producer"
  }
}
