#!/usr/bin/env bash
set -euo pipefail

# First arg is the path to your Terraform infra directory
INFRA_DIR="${1:-Infrastructure}"

AWS_REGION="ap-south-1"
TF_BUCKET="my-tf-state-bucket-rex-2025"
TF_DDB_TABLE="my-tf-lock-table-rex-2025"
APP_NAME="jokes-app"

# ─── Pre-cleanup: delete *all* images in ECR so the repo is empty ───
# ─── Pre-cleanup: delete *all* images in ECR so the repo is empty ───
echo "🗑️ Purging all images from ECR repo: ${APP_NAME}"

if aws ecr describe-repositories \
     --repository-names "${APP_NAME}" \
     --region "${AWS_REGION}" >/dev/null 2>&1; then

  IMAGE_IDS_JSON=$(aws ecr list-images \
    --repository-name "${APP_NAME}" \
    --region "${AWS_REGION}" \
    --query 'imageIds' \
    --output json)

  if [[ "$(echo "${IMAGE_IDS_JSON}" | jq length)" -gt 0 ]]; then
    aws ecr batch-delete-image \
      --repository-name "${APP_NAME}" \
      --region "${AWS_REGION}" \
      --image-ids "${IMAGE_IDS_JSON}"
    echo "✅ Deleted all images."
  else
    echo "ℹ️ No images to delete."
  fi

else
  echo "⚠️ ECR repo ${APP_NAME} not found; skipping image purge."
fi


if [[ "$(echo "${IMAGE_IDS_JSON}" | jq length)" -gt 0 ]]; then
  aws ecr batch-delete-image \
    --repository-name "${APP_NAME}" \
    --region "${AWS_REGION}" \
    --image-ids "${IMAGE_IDS_JSON}"
  echo "✅ Deleted all images."
else
  echo "ℹ️ No images to delete."
fi

# ─── Terraform destroy: clean up all resources ───
echo "➡️ Initializing Terraform backend…"
cd "$INFRA_DIR"

terraform init \
  -backend-config="bucket=${TF_BUCKET}" \
  -backend-config="key=${APP_NAME}/terraform.tfstate" \
  -backend-config="region=${AWS_REGION}" \
  -backend-config="dynamodb_table=${TF_DDB_TABLE}"

echo "🧨 Destroying all Terraform resources…"
terraform destroy -auto-approve

# ─── 2) Empty and delete the S3 bucket (including all versions) ───
echo "🗑️ Emptying versioned S3 bucket: ${TF_BUCKET}"
if ! aws s3api head-bucket --bucket "${TF_BUCKET}" 2>/dev/null; then
  echo "⚠️ Bucket ${TF_BUCKET} not found or already deleted—skipping."
else
  VERSIONS_JSON=$(aws s3api list-object-versions --bucket "${TF_BUCKET}" --output json)

  # Build a safe delete payload even if Versions or DeleteMarkers are null
  to_delete=$(jq -nc --argjson v "$VERSIONS_JSON" '
    ($v.Versions // []) + ($v.DeleteMarkers // [])
    | map({Key:.Key, VersionId:.VersionId})
    | {Objects: ., Quiet: false}
  ')

  if [[ $(jq '.Objects | length' <<<"$to_delete") -gt 0 ]]; then
    aws s3api delete-objects \
      --bucket "${TF_BUCKET}" \
      --delete "$to_delete"
    echo "✅ Deleted all object versions and delete markers."
  else
    echo "ℹ️ No object versions or delete markers found."
  fi

  echo "🧨 Deleting the S3 bucket ${TF_BUCKET}"
  aws s3api delete-bucket --bucket "${TF_BUCKET}" --region "${AWS_REGION}"
  echo "✅ Bucket deleted."
fi

# ─── 3) Delete the DynamoDB lock table ───
echo "🗑️ Deleting DynamoDB table: ${TF_DDB_TABLE}"
aws dynamodb delete-table \
  --table-name "${TF_DDB_TABLE}" \
  --region "${AWS_REGION}" \
  2>/dev/null || echo "⚠️ Table ${TF_DDB_TABLE} not found or already deleted."
echo "✅ DynamoDB table deleted."

echo "🎉 All resources torn down successfully!"
