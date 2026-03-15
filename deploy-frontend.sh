#!/bin/bash
# deploy-frontend.sh
# Builds the React app and deploys it to S3 + invalidates CloudFront.
# Run this after any frontend code changes.

set -e

STACK_NAME="agent-browser"

echo "Fetching deployment info from CloudFormation stack '$STACK_NAME'..."

BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

APP_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`AppUrl`].OutputValue' \
  --output text)

if [ -z "$BUCKET" ]; then
  echo "ERROR: Stack '$STACK_NAME' not found. Run: sam build && sam deploy --guided"
  exit 1
fi

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Uploading to s3://$BUCKET/ ..."
# Upload with correct content types; exclude the agents/ prefix
aws s3 sync frontend/dist/ "s3://$BUCKET/" \
  --delete \
  --exclude "agents/*" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# index.html should never be cached
aws s3 cp frontend/dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo ""
echo "✓ Frontend deployed!"
echo "  CloudFront invalidation: $INVALIDATION_ID (takes ~30–60 seconds)"
echo "  App URL: $APP_URL"
