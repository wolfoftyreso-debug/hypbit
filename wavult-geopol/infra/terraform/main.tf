############################################################
# Wavult Geopol — AWS infrastructure (skeleton)
#
# This is a scaffold. Fill in variable values and the module
# implementations before applying. Intended target: ECS Fargate
# for app services, MSK for Kafka, self-managed Neo4j on EC2
# (or Neo4j Aura), ElastiCache Redis, OpenSearch Service.
############################################################

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "eu-north-1"
}

variable "project" {
  type    = string
  default = "wavult-geopol"
}

variable "environment" {
  type    = string
  default = "prod"
}

locals {
  name_prefix = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# --- Networking ----------------------------------------------------

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name_prefix}-vpc"
  cidr = "10.42.0.0/16"

  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.42.1.0/24", "10.42.2.0/24", "10.42.3.0/24"]
  public_subnets  = ["10.42.101.0/24", "10.42.102.0/24", "10.42.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.tags
}

# --- ECS cluster for app services ----------------------------------

module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 5.0"

  cluster_name = "${local.name_prefix}-ecs"

  tags = local.tags
}

# --- Kafka (MSK) ---------------------------------------------------
#
# module "kafka" {
#   source = "./modules/msk"
#   name   = "${local.name_prefix}-kafka"
#   vpc_id = module.vpc.vpc_id
#   subnet_ids = module.vpc.private_subnets
#   tags = local.tags
# }

# --- Neo4j ---------------------------------------------------------
#
# module "neo4j" {
#   source = "./modules/neo4j"
#   name   = "${local.name_prefix}-neo4j"
#   vpc_id = module.vpc.vpc_id
#   subnet_ids = module.vpc.private_subnets
#   tags = local.tags
# }

# --- Redis (ElastiCache) ------------------------------------------
#
# module "redis" {
#   source = "terraform-aws-modules/elasticache/aws"
#   ...
# }

# --- OpenSearch ----------------------------------------------------
#
# module "opensearch" {
#   source = "terraform-aws-modules/opensearch/aws"
#   ...
# }

output "vpc_id" {
  value = module.vpc.vpc_id
}
