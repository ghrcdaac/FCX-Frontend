#!/bin/bash

set -e  # Abort script if any command fails

# Export AWS credentials from Bamboo variables
export AWS_REGION="${bamboo_AWS_REGION:-$AWS_REGION}"
export AWS_ACCESS_KEY_ID="${bamboo_SVC_AWS_PROD_ACCESS_KEY:-$AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${bamboo_SVC_AWS_PROD_SECRET_ACCESS_KEY:-$AWS_SECRET_ACCESS_KEY}"

# Check if AWS credentials are valid
echo "Validating AWS credentials..."
aws sts get-caller-identity >/dev/null

# Clean up any existing local dist directory
rm -rf ./dist

# If .env does not exist, dynamically generate it from all available environment variables
if [ ! -f .env ]; then
  echo "No .env file found. Dynamically generating .env from environment variables..."
  touch .env
  env | grep -E '^(REACT_APP_|bamboo_)' | while IFS= read -r line; do
    # Remove leading bamboo_ prefix if present
    key_val=$(echo "$line" | sed 's/^bamboo_//')
    key=$(echo "$key_val" | cut -d= -f1)
    val=$(echo "$key_val" | cut -d= -f2-)

    # Skip AWS internal credential vars
    case "$key" in
      AWS_*|SVC_AWS_*) continue ;;
    esac

    # Output exact REACT_APP_ variable
    if [[ "$key" == REACT_APP_* ]]; then
      echo "${key}=${val}" >> .env
    else
      echo "REACT_APP_${key}=${val}" >> .env
      echo "REACT_APP_BAMBOO_${key}=${val}" >> .env
    fi
  done || true
else
  echo "Using existing .env file found in workspace."
fi

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
