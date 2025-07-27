provider "aws" {
  region = var.aws_region
}

# Bucket
resource "aws_s3_bucket" "tf_state-rex-2025" {
  bucket = var.state_bucket_name
  force_destroy = true
  tags   = { Name = "${var.app_name}-tf-state" }
}

# Bucket Versioning (New Way)
resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.tf_state-rex-2025.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
  tags = { Name = "${var.app_name}-tf-locks" }
}