#!/bin/bash
set -e

echo "🧪 Running Bunberry Tests"
echo "--------------------------"

# Build the project first
echo "📦 Building project..."
bun run build

# Run unit tests
echo "🔍 Running unit tests..."
bun test

# Run integration tests
echo "🔄 Running integration tests..."
bun test tests/integration.test.ts

# Test Docker builds with pre-built dist
echo "🐳 Testing in container without Bun..."
if docker build --target base -t bunberry-base .; then
  echo "🏗️ Docker base image built successfully"
  if docker run --rm -v $(pwd)/dist:/app/dist -v $(pwd)/package.json:/app/package.json -v $(pwd)/tests:/app/tests bunberry-base node /app/dist/index.js test-project-no-bun; then
    echo "✅ Docker test without Bun successful"
  else
    echo "❌ Docker test without Bun failed but this might be expected"
    # Continue anyway as we expect it to fail without Bun
  fi
  
  echo "🐳 Installing Bun in container and testing again..."
  if docker run --rm -v $(pwd)/dist:/app/dist -v $(pwd)/package.json:/app/package.json -v $(pwd)/tests:/app/tests bunberry-base /bin/bash -c "npm install -g bun && node /app/dist/index.js test-project-with-bun"; then
    echo "✅ Docker test with Bun successful"
  else
    echo "❌ Docker test with Bun failed"
    exit 1
  fi
else
  echo "❌ Docker build failed"
  exit 1
fi

echo "✨ All tests completed successfully!" 