#!/usr/bin/env bash
# ==============================================================================
# EnergyOps Workflow Platform - Production Build Script
# Compiles backend TypeScript and Angular frontend production bundles.
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
echo -e "${BLUE}🏗 Building Production Bundles${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Backend Build
echo -e "\n${YELLOW}▶ [1/2] Compiling Backend TypeScript...${NC}"
cd "${REPO_ROOT}/backend"
if npm run build; then
  echo -e "${GREEN}✔ Backend build succeeded (dist/ created).${NC}"
else
  echo -e "${RED}✖ Backend build failed.${NC}"
  exit 1
fi

# 2. Frontend Build
echo -e "\n${YELLOW}▶ [2/2] Compiling Frontend Angular App (Production)...${NC}"
cd "${REPO_ROOT}/frontend"
if npm run build; then
  echo -e "${GREEN}✔ Frontend production build succeeded (dist/ created).${NC}"
else
  echo -e "${RED}✖ Frontend production build failed.${NC}"
  exit 1
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}✔ ALL PRODUCTION BUILDS COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}====================================================${NC}"
