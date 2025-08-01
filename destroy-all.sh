#!/usr/bin/env bash
set -euo pipefail

# First arg is the path to Terraform code
INFRA_DIR="${1:-Infrastructure}"

AWS_REGION="ap-south-1"
TF_BUCKET="my-tf-state-bucket-rex-2025"
TF_DDB_TABLE="my-tf-lock-table-rex-2025"
APP_NAME="jokes-app"

echo "➡️ Initializing Terraform backend…"
cd "$INFRA_DIR"
terraform init \
  -backend-config="bucket=${TF_BUCKET}" \
  -backend-config="key=${APP_NAME}/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}" \
  -backend-config="dynamodb_table=${TF_DDB_TABLE}"

echo "🧨 Destroying all Terraform resources…"
terraform destroy -auto-approve

# ... then S3 & DynamoDB cleanup as before ...


### 2) Empty and delete the S3 bucket (including all versions) ###
echo "🗑️ Emptying versioned S3 bucket: ${TF_BUCKET}"
# List and delete all object versions and delete markers
VERSIONS_JSON=$(aws s3api list-object-versions --bucket "${TF_BUCKET}" --output json)

# Build a delete list for both versions and delete markers
to_delete=$(jq -r '
  [ .Versions[], .DeleteMarkers[] ]
  | map({Key:.Key, VersionId:.VersionId})
  | {Objects: .}
' <<<"${VERSIONS_JSON}")

# If there’s anything to delete, send to S3
if [[ $(jq '.Objects | length' <<<"${to_delete}") -gt 0 ]]; then
  aws s3api delete-objects \
    --bucket "${TF_BUCKET}" \
    --delete "${to_delete}"
  echo "✅ All object versions deleted."
else
  echo "⚠️ No object versions or delete markers found."
fi

echo "🧨 Deleting the S3 bucket ${TF_BUCKET}"
aws s3api delete-bucket --bucket "${TF_BUCKET}" --region "${AWS_REGION}"
echo "✅ Bucket deleted."

### 3) Delete the DynamoDB lock table ###
echo "🗑️ Deleting DynamoDB table: ${TF_DDB_TABLE}"
aws dynamodb delete-table \
  --table-name "${TF_DDB_TABLE}" \
  --region "${AWS_REGION}"
echo "✅ DynamoDB table deleted."

echo "🎉 All resources torn down successfully!"
#