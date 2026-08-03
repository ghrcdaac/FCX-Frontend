#!/bin/bash

set -e  # Abort script if any command fails

# Export AWS credentials from Bamboo variables
export AWS_REGION="$bamboo_AWS_REGION"
export AWS_ACCESS_KEY_ID="$bamboo_SVC_AWS_PROD_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$bamboo_SVC_AWS_PROD_SECRET_ACCESS_KEY"

# Check if AWS credentials are valid
echo "Validating AWS credentials..."
aws sts get-caller-identity >/dev/null

# Clean up any existing local dist directory
rm -rf ./dist

# Build the Docker image (uses Node v16.20.2 64-bit and yarn inside container)
echo "Building Docker image (fcx)..."
docker build . -t fcx

# Create a unique container instance
CID=$(docker create fcx)

# Copy build artifacts from container's /app/build directory to local ./dist directory
echo "Extracting build artifacts..."
docker cp "${CID}":/app/build ./dist

# Clean up the container
docker rm "${CID}"

# Validate AWS S3 connectivity
echo "Validating AWS S3 access..."
aws s3 ls s3://ghrc-web-services >/dev/null

# Backup previous build files from ghrc-web-services/fcx to ghrc-web-services-backup/fcx
echo "Backing up current deployment to s3://ghrc-web-services-backup/fcx..."
aws s3 sync s3://ghrc-web-services/fcx s3://ghrc-web-services-backup/fcx

# Sync local build files to target S3 bucket subfolder ghrc-web-services/fcx
echo "Deploying new build to s3://ghrc-web-services/fcx..."
aws s3 sync ./dist s3://ghrc-web-services/fcx

# Cleanup the local dist directory
rm -rf ./dist

echo "Deployment completed successfully."
