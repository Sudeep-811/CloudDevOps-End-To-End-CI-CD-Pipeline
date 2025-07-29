#!/usr/bin/env bash
set -euo pipefail

### CONFIGURATION — change these to your values ###
AWS_REGION="ap-south-1"
TF_BUCKET="my-tf-state-bucket-rex-2025"
TF_DDB_TABLE="my-tf-lock-table-rex-2025"
APP_NAME="jokes-app"
ECR_REPO="${APP_NAME}"
LOG_GROUP="/ecs/${APP_NAME}"

### 1) Destroy Terraform‑managed resources ###
echo "➡️ Destroying Terraform resources…"
cd Infrastructure
terraform init \
  -backend-config="bucket=${TF_BUCKET}" \
  -backend-config="key=${APP_NAME}/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}" \
  -backend-config="dynamodb_table=${TF_DDB_TABLE}"
terraform destroy -auto-approve
cd ..

### 2) Tear down the remote state backend ###
echo "➡️ Deleting remote state backend (S3 + DynamoDB)…"
aws s3 rb "s3://${TF_BUCKET}" --force
aws dynamodb delete-table --table-name "${TF_DDB_TABLE}" --region "${AWS_REGION}" || true

### 3) (Optional) Delete ECR repository ###
echo "➡️ Deleting ECR repository ${ECR_REPO}…"
aws ecr delete-repository \
  --repository-name "${ECR_REPO}" \
  --force \
  --region "${AWS_REGION}" || true

### 4) (Optional) Delete CloudWatch Log Group ###
echo "➡️ Deleting CloudWatch Log Group ${LOG_GROUP}…"
aws logs delete-log-group \
  --log-group-name "${LOG_GROUP}" \
  --region "${AWS_REGION}" || true

echo "✅ All done. Everything’s destroyed!"
