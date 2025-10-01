#!/bin/bash

# AP2 Service Setup Script
# This script automates the initial setup process

set -e

echo "AP2 AI Inference Metering Service Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm installed: $PNPM_VERSION"
else
    print_error "pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

if command_exists docker; then
    print_success "Docker installed"
else
    print_error "Docker not found. Please install Docker from https://www.docker.com/"
    exit 1
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
pnpm install
print_success "Backend dependencies installed"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
pnpm install
cd ..
print_success "Frontend dependencies installed"

echo ""
echo "Setting up environment..."
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_warning ".env file created. Please edit it with your configuration:"
    echo "  - MERCHANT_PRIVATE_KEY"
    echo "  - USDC_ADDRESS"
    echo ""
    print_info "You can get the USDC address from: ../x402-service/out/addresses.sepolia.json"
else
    print_success ".env file already exists"
fi

echo ""
echo "Starting Ollama..."
echo ""

# Start Ollama with Docker Compose
print_info "Starting Ollama container..."
docker-compose up -d

# Wait for Ollama to be ready
print_info "Waiting for Ollama to be ready..."
sleep 5

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_success "Ollama is running"
else
    print_warning "Ollama may not be ready yet. You can check with: docker-compose logs ollama"
fi

echo ""
echo "Pulling AI model..."
echo ""

# Pull the model
print_info "Pulling llama3.1:8b model (this may take a few minutes)..."
docker exec ap2-ollama ollama pull llama3.1:8b
print_success "Model pulled successfully"

echo ""
echo "Checking x402 services..."
echo ""

# Check if x402 services are running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Quote service is running (:3001)"
else
    print_warning "Quote service not detected. Make sure to start it with: cd ../x402-service && pnpm dev:service"
fi

if curl -s http://localhost:3002/supported > /dev/null 2>&1; then
    print_success "Facilitator is running (:3002)"
else
    print_warning "Facilitator not detected. Make sure to start it with: cd ../x402-service && pnpm dev:facilitator"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   - MERCHANT_PRIVATE_KEY (wallet that receives payments)"
echo "   - USDC_ADDRESS (from x402 deployment)"
echo ""
echo "2. Make sure x402 services are running:"
echo "   cd ../x402-service"
echo "   pnpm dev:facilitator  # Terminal 1"
echo "   pnpm dev:service      # Terminal 2"
echo ""
echo "3. Start the AP2 service:"
echo "   pnpm dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For more information, see:"
echo "  - README.md (full documentation)"
echo "  - QUICKSTART.md (quick start guide)"
echo ""
