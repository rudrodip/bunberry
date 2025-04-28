FROM node:20-slim AS base
WORKDIR /app

# This is a minimal container to test the pre-built JS without Bun
# We'll mount the dist directory, package.json and tests at runtime

# We can still keep a testing image with Bun pre-installed for comparison
FROM oven/bun:latest AS test-with-bun
WORKDIR /app
COPY . .

# Install dependencies
RUN bun install

# Build the project
RUN bun run build

# Run integration tests
RUN bun test tests/docker.test.ts && bun test tests/integration.test.ts

# Default to base image
FROM base 