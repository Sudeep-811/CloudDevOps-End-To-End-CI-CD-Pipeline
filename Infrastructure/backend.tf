variable "app_name" {
  type    = string
  default = "jokes-app"
}

terraform {
  backend "s3" {
    bucket         = "my‑tf‑state‑bucket‑rex‑2025"
    key            = "${var.app_name}/terraform.tfstate"     
    region         = "ap‑south‑1"
    dynamodb_table = "my‑tf‑lock‑table‑rex‑2025"
  }
}
