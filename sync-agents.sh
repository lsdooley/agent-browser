#!/bin/bash
# sync-agents.sh
# Pushes your local ~/.claude/agents/ to S3 and rebuilds the metadata manifest.
# Run this any time you add, remove, or update agents on your Mac.

set -e

STACK_NAME="agent-browser"

echo "Looking up S3 bucket from CloudFormation stack '$STACK_NAME'..."

BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$BUCKET" ]; then
  echo ""
  echo "ERROR: Could not find stack '$STACK_NAME'."
  echo "Deploy the backend first: sam build && sam deploy --guided"
  exit 1
fi

echo "Syncing ~/.claude/agents/ → s3://$BUCKET/agents/"

aws s3 sync ~/.claude/agents/ "s3://$BUCKET/agents/" \
  --delete \
  --exclude ".DS_Store" \
  --exclude "*/.DS_Store" \
  --exclude ".git" \
  --exclude ".git/*"

echo "Rebuilding agent manifest..."
node "$(dirname "$0")/scripts/build-manifest.js"

echo ""
echo "✓ Done! Agents and manifest updated."
