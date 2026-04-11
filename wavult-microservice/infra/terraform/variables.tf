variable "aws_region" {
  type        = string
  description = "AWS region to deploy into"
  default     = "eu-north-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"
}

variable "service_name" {
  type        = string
  default     = "wavult-microservice"
}

variable "vpc_id" {
  type        = string
  description = "VPC to deploy the service into"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnets for ECS tasks"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnets for ALB"
}

variable "image_tag" {
  type        = string
  default     = "latest"
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "task_cpu" {
  type    = number
  default = 512
}

variable "task_memory" {
  type    = number
  default = 1024
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "database_url_secret_arn" {
  type        = string
  description = "ARN of the Secrets Manager secret containing DATABASE_URL"
}

variable "redis_url" {
  type        = string
  description = "ElastiCache primary endpoint"
}

variable "kafka_brokers" {
  type        = string
  description = "Comma-separated MSK bootstrap broker list"
}
