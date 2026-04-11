variable "aws_region" {
  type    = string
  default = "eu-north-1"
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "services" {
  description = "Logical name -> container port"
  type        = map(number)
  default = {
    identity-service = 3000
    document-service = 3001
    face-service     = 3002
    risk-service     = 3003
    audit-service    = 3004
  }
}
