resource "aws_s3_bucket" "identity" {
  bucket        = "amos-identity-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.environment != "prod"
}

resource "aws_s3_bucket_public_access_block" "identity" {
  bucket                  = aws_s3_bucket.identity.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "identity" {
  bucket = aws_s3_bucket.identity.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "identity" {
  bucket = aws_s3_bucket.identity.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "identity" {
  bucket = aws_s3_bucket.identity.id

  rule {
    id     = "expire-old-pii"
    status = "Enabled"
    expiration {
      days = 90
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
