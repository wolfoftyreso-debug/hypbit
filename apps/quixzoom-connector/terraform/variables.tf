variable "region" {
  description = "AWS region — matches the Wavult OS / HypBit control plane"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "service_name" {
  description = "Logical service name — used for naming AWS resources"
  type        = string
  default     = "quixzoom-connector"
}

variable "container_image" {
  description = "ECR URI of the quixzoom-connector image to deploy"
  type        = string
}

variable "desired_count" {
  description = "Number of Fargate tasks"
  type        = number
  default     = 2
}

variable "task_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 512
}

variable "msk_cluster_arn" {
  description = "ARN of the existing MSK cluster hosting quiXzoom topics"
  type        = string
}

variable "msk_bootstrap_brokers" {
  description = "Kafka bootstrap broker list for the connector to publish to"
  type        = string
}

variable "kafka_security_group_id" {
  description = "Security group of the existing MSK cluster so the connector can reach it"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 30
}
