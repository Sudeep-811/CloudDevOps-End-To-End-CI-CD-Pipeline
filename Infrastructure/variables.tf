variable "aws_region" {
  type        = string
  description = "AWS region to deploy into"
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "172.31.0.0/16"
}

variable "public_subnets" {
  type = map(string)
  default = {
    a = "172.31.1.0/24"
    b = "172.31.2.0/24"
  }
}

variable "private_subnets" {
  type = map(string)
  default = {
    a = "172.31.3.0/24"
    b = "172.31.4.0/24"
  }
}



variable "web_app_name" {
  type        = string
  description = "Name of your application"
  default     = "jokes-app"
}

variable "desired_count" {
  type        = number
  description = "Number of ECS tasks to run"
  default     = 2
}
