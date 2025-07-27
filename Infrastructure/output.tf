output "alb_dns_name" {
  description = "Public DNS name of the ALB"
  value       = aws_lb.main_alb.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.app_cluster.name
}

output "ecr_repo_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app_ecr_repo.repository_url
}
