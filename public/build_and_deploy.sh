#!/bin/sh

#make sure environmental variable FCX_S3_BUCKET is set
yarn build
aws s3 sync build/ FCX_S3_BUCKET