terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }

  # Remote state lives alongside the other HypBit services.
  backend "s3" {
    bucket         = "hypbit-terraform-state"
    key            = "quixzoom-connector/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "hypbit-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Service     = "quixzoom-connector"
      Environment = var.environment
      ManagedBy   = "terraform"
      Repo        = "hypbit"
    }
  }
}
