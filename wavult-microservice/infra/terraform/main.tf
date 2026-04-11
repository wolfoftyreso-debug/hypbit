terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  backend "s3" {
    # configure per environment
    # bucket         = "wavult-terraform-state"
    # key            = "microservice/terraform.tfstate"
    # region         = "eu-north-1"
    # dynamodb_table = "wavult-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Service     = var.service_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "platform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
