#!/usr/bin/env bash
# ==============================================================================
# EnergyOps Workflow Platform - Test Suite Runner
# Runs Vitest backend tests and Karma ChromeHeadless frontend tests.
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
echo -e "${BLUE}🧪 Running EnergyOps Automated Test Suites${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Backend Vitest Integration & Security Tests
echo -e "\n${YELLOW}▶ [1/2] Running Backend Tests (Vitest + SQLite)...${NC}"
cd "${REPO_ROOT}/backend"
if npm test; then
  echo -e "${GREEN}✔ Backend test suite passed successfully.${NC}"
else
  echo -e "${RED}✖ Backend test suite failed.${NC}"
  exit 1
fi

# 2. Frontend Karma Unit & WCAG 2.1 AA Accessibility Tests
echo -e "\n${YELLOW}▶ [2/2] Running Frontend Tests (Karma + ChromeHeadless + axe-core)...${NC}"
cd "${REPO_ROOT}/frontend"
if npx ng test --no-watch --browsers=ChromeHeadless; then
  echo -e "${GREEN}✔ Frontend test suite passed successfully.${NC}"
else
  echo -e "${RED}✖ Frontend test suite failed.${NC}"
  exit 1
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}✔ ALL TEST SUITES PASSED (Backend + Frontend)${NC}"
echo -e "${GREEN}====================================================${NC}"
