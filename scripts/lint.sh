#!/usr/bin/env bash
# ==============================================================================
# EnergyOps Workflow Platform - Linter Runner
# Runs ESLint across both backend TypeScript and frontend Angular codebase.
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}🔍 Running Code Linting & Static Analysis${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Backend Linting
echo -e "\n${YELLOW}▶ [1/2] Linting Backend TypeScript (ESLint)...${NC}"
cd "${REPO_ROOT}/backend"
if npm run lint; then
  echo -e "${GREEN}✔ Backend linting passed with zero errors.${NC}"
else
  echo -e "${RED}✖ Backend linting found errors.${NC}"
  exit 1
fi

# 2. Frontend Linting
echo -e "\n${YELLOW}▶ [2/2] Linting Frontend Angular TypeScript (ESLint)...${NC}"
cd "${REPO_ROOT}/frontend"
if npm run lint; then
  echo -e "${GREEN}✔ Frontend linting passed with zero errors.${NC}"
else
  echo -e "${RED}✖ Frontend linting found errors.${NC}"
  exit 1
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}✔ ALL LINTER CHECKS PASSED (Clean Codebase)${NC}"
echo -e "${GREEN}====================================================${NC}"
