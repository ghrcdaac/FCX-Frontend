# Use Node v16.20.2 (64-bit) base image
FROM node:16.20.2-slim

# Set working directory inside container
WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source files
COPY . .

# Build the frontend application
RUN yarn build
