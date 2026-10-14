#!/usr/bin/env bash
# ==============================================================================
# EnergyOps Workflow Platform - Development Environment Setup Script
# POSIX-compliant, portable across Linux, macOS, WSL, and Git Bash.
# ==============================================================================
set -euo pipefail

# ANSI Color formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}⚡ Setting up EnergyOps Workflow Platform Workspace${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Check Node.js prerequisite
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js is not installed. Please install Node.js v18 or later.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✔ Detected Node.js: ${NODE_VERSION}${NC}"

# 2. Check npm prerequisite
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] npm is not installed.${NC}"
  exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✔ Detected npm: v${NPM_VERSION}${NC}"

# Find repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 3. Install backend dependencies
echo -e "\n${BLUE}📦 Installing backend dependencies...${NC}"
cd "${REPO_ROOT}/backend"
npm install --no-audit

# 4. Initialize & seed SQLite database
echo -e "\n${BLUE}🗄 Initializing and seeding SQLite database...${NC}"
npm run seed

# 5. Install frontend dependencies
echo -e "\n${BLUE}📦 Installing frontend dependencies...${NC}"
cd "${REPO_ROOT}/frontend"
npm install --no-audit

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}✔ EnergyOps Workflow Platform Setup Complete!${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Next steps:"
echo -e "  - Run test suite:  ${YELLOW}./scripts/test.sh${NC}"
echo -e "  - Run code lint:   ${YELLOW}./scripts/lint.sh${NC}"
echo -e "  - Build bundles:   ${YELLOW}./scripts/build.sh${NC}"
echo -e "  - Start backend:   ${YELLOW}cd backend && npm run dev${NC}"
echo -e "  - Start frontend:  ${YELLOW}cd frontend && npm start${NC}"
