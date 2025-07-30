#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Set your variables
BUCKET_NAME="my-tf-state-bucket-rex-2025"
TABLE_NAME="my-tf-state-bucket-rex-2025"
STATE_KEY="jokes-app/terraform.tfstate"
REGION="ap-south-1"

echo "🧨 Destroying all infrastructure except the backend (S3 & DynamoDB)..."
terraform destroy -target="null_resource.dummy" -auto-approve  # placeholder

# Remove everything except backend
terraform destroy \
  -auto-approve \
  -target=module.vpc \
  -target=aws_ecs_service.jokes_app_service \
  -target=aws_ecs_task_definition.jokes_app_task \
  -target=aws_lb.jokes_alb \
  -target=aws_lb_target_group.jokes_tg \
  -target=aws_lb_listener.jokes_listener \
  -target=aws_security_group.* \
  -target=aws_iam_role.* \
  -target=aws_cloudwatch_log_group.* \
  -target=aws_ecr_repository.* \
  -target=aws_subnet.* \
  -target=aws_route_table.* \
  -target=aws_internet_gateway.* \
  -target=aws_nat_gateway.* \
  -target=aws_route_table_association.* \
  -target=aws_vpc.* \
  -target=aws_eip.*

echo "✅ Infra resources destroyed. Proceeding to backend cleanup..."
sleep 3

# Now remove backend items

echo "🗑 Deleting Terraform lock from DynamoDB..."
aws dynamodb delete-item \
  --table-name $TABLE_NAME \
  --key "{\"LockID\": {\"S\": \"$STATE_KEY\"}}" \
  --region $REGION

echo "🧼 Cleaning up all object versions in S3 bucket: $BUCKET_NAME"
# Remove all versions & delete markers
VERSIONS=$(aws s3api list-object-versions --bucket $BUCKET_NAME --region $REGION \
           --query='Versions[].{Key:Key,VersionId:VersionId}' --output text)

DELETES=$(echo "$VERSIONS" | while read -r key versionId; do
  echo "{\"Key\":\"$key\",\"VersionId\":\"$versionId\"},"
done | sed '$ s/,$//')

if [ -n "$DELETES" ]; then
  aws s3api delete-objects --bucket $BUCKET_NAME --region $REGION \
    --delete "{\"Objects\":[$DELETES]}"
fi

echo "🪣 Deleting S3 bucket..."
aws s3api delete-bucket --bucket $BUCKET_NAME --region $REGION

echo "📦 Deleting DynamoDB table..."
aws dynamodb delete-table --table-name $TABLE_NAME --region $REGION

echo "✅ All infrastructure and backend deleted successfully!"
