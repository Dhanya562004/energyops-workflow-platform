# EnergyOps Workflow Platform - Product Backlog

> **Notice & Working Agreement**:  
> This backlog represents the product-level backlog for the EnergyOps platform, prioritized according to enterprise operations and renewable utility requirements. As documented in the sprint logs, implementation is executed in solo developer sprints following Agile/Scrum principles without manufactured team ceremonies.

---

## 1. Backlog Summary & Prioritization Matrix

| ID | Title | Priority | Points | Status | Category |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-01** | Unidirectional State Management for Kanban Board | Critical | 8 | Done | Frontend Architecture |
| **US-02** | Deep Job Detail State & Asynchronous Side-Effects | High | 5 | Done | Frontend Architecture |
| **US-03** | Frontend & Backend Automated Unit Testing Gates | Critical | 8 | Done | Quality Assurance |
| **US-04** | WCAG 2.1 AA Accessibility & Keyboard Navigability | High | 5 | Done | Accessibility & UX |
| **US-05** | Enterprise Responsive Layout & Command Center Navigation | Medium | 5 | Done | Frontend Design |
| **US-06** | JWT Authentication & Role-Based Authorization Guardrails | Critical | 8 | Done | Security & Governance |
| **US-07** | Strict Input Validation Schemas for Mutation APIs | High | 5 | Done | Security & Data Integrity |
| **US-08** | Multi-Stage OCI Containerization & Hardened Web Server | High | 5 | Done | Cloud-Native & DevOps |
| **US-09** | POSIX Automation Scripts for Environment Maintenance | Medium | 3 | Done | Developer Experience |
| **US-10** | Continuous Integration Pipeline with Container Build Verification | High | 5 | Done | CI/CD |
| **US-11** | Azure DevOps Pipeline for Enterprise Cloud Release | Medium | 3 | Done | CI/CD |
| **US-12** | Real-Time WebSocket Alerts for Grid Failure Events | Medium | 8 | Backlog | Real-Time Features |
| **US-13** | Prometheus Metrics Exporter & Grafana Operations Dashboard | Low | 5 | Backlog | Observability |
| **US-14** | Multi-Tenant Site Segmentation with Row-Level Security | Low | 13 | Backlog | Enterprise Multi-Tenancy |

---

## 2. Detailed User Stories

### US-01: Unidirectional State Management for Kanban Board
- **As an** Operations Lead,
- **I want** all job status changes and stage transitions on the Kanban board to flow through a centralized, immutable state store,
- **So that** the UI reflects consistent operational data without race conditions, template business logic, or desynchronized state.
- **Acceptance Criteria**:
  1. NgRx Store and Effects configured for `@ngrx/store` and `@ngrx/effects` v18+.
  2. Actions defined for `loadJobs`, `loadJobsSuccess`, `loadJobsFailure`, `updateJobStage`, `updateJobStageSuccess`, `updateJobStageFailure`.
  3. Reducer handles state immutably with loading/error flags.
  4. Selectors memoize job slices by workflow stage.
  5. Component template contains zero direct mutation logic.

---

### US-02: Deep Job Detail State & Asynchronous Side-Effects
- **As a** Field Project Manager,
- **I want** the Job Detail view to load job relationships (audit history, blockers, alerts, notes) via NgRx effects,
- **So that** I have full visibility into the job's lifecycle with reactive notifications on state updates.
- **Acceptance Criteria**:
  1. `loadJobDetail` action triggers `JobEffects.loadJobDetail$` side-effect.
  2. Success and failure toasts dispatched via `ToastService`.
  3. Active blockers clearly highlighted with resolution actions restricted to Managers.

---

### US-03: Frontend & Backend Automated Unit Testing Gates
- **As a** Release Engineer,
- **I want** comprehensive automated unit test suites with failure-path testing,
- **So that** regressions in critical state logic, HTTP calls, or workflow rules are caught prior to deployment.
- **Acceptance Criteria**:
  1. Backend unit and security tests achieve 100% pass rate in Vitest.
  2. Frontend NgRx reducers, services, and components achieve 100% pass rate in Karma ChromeHeadless.
  3. Failure paths (400 validation, 401 unauth, 403 forbidden, 500 network) explicitly verified with mocks.

---

### US-04: WCAG 2.1 AA Accessibility & Keyboard Navigability
- **As an** Operations Specialist with accessibility needs,
- **I want** high-contrast focus indicators, ARIA live regions, semantic landmarks, and skip-to-content links,
- **So that** I can operate the platform using screen readers and keyboard navigation exclusively.
- **Acceptance Criteria**:
  1. `:focus-visible` styling applied to all interactive controls with 3px high-contrast rings and 2px offset.
  2. Skip link rendered as first focusable element.
  3. Automated `axe-core` accessibility audit executes during test runs with zero critical or serious WCAG 2.1 AA violations.

---

### US-05: Enterprise Responsive Layout & Command Center Navigation
- **As a** Mobile Site Supervisor,
- **I want** the platform layout to adapt seamlessly across desktop (1280px+), tablet (768px), and mobile (375px) viewports,
- **So that** I can review job pipelines on field tablets or smartphones without horizontal scrolling or broken elements.
- **Acceptance Criteria**:
  1. Desktop features fixed sidebar command navigation.
  2. Tablet and mobile feature a responsive, collapsible top navigation bar.
  3. KPI summary cards wrap cleanly from 4-columns (desktop) to 3-columns (tablet) and 2-columns (mobile).
  4. Verified via headless Chrome automated viewport captures.

---

### US-06: JWT Authentication & Role-Based Authorization Guardrails
- **As a** Security Compliance Auditor,
- **I want** cryptographic JSON Web Tokens and strict role-based access control (Admin, Manager, Engineer),
- **So that** unauthorized users cannot trigger state mutations, create contracts, or resolve operational blockers.
- **Acceptance Criteria**:
  1. `authMiddleware.ts` verifies signed JWT bearer tokens and Streamlit service keys (`AQ.Ab...`).
  2. `POST /api/jobs` requires `Manager` or `Admin` role; `Engineer` receives `403 FORBIDDEN_ROLE`.
  3. `PATCH /api/blockers/:id/resolve` requires `Manager` or `Admin` role.
  4. `POST /api/seed/reset` requires `Admin` role.
  5. Unauthenticated mutation attempts receive `401 UNAUTHORIZED`.

---

### US-07: Strict Input Validation Schemas for Mutation APIs
- **As an** API Consumer,
- **I want** write endpoints to strictly validate required fields, string lengths, and enumerated values,
- **So that** malformed or corrupt payloads are rejected with descriptive 400 Bad Request error messages.
- **Acceptance Criteria**:
  1. Job creation requires valid customerName (min 2 chars), siteAddress (min 5 chars), and recognized productType.
  2. Stage transition requires target stage to belong to `WORKFLOW_STAGES`.
  3. Status update to `Blocked` requires non-empty `blockerReason`.
  4. Blocker creation requires `reason` with minimum length of 5 characters.

---

### US-08: Multi-Stage OCI Containerization & Hardened Web Server
- **As a** Cloud Platform Engineer,
- **I want** production-grade, multi-stage OCI Dockerfiles for both backend and frontend,
- **So that** services can be deployed reliably across container runtimes with minimal attack surface.
- **Acceptance Criteria**:
  1. Pinned base images (`node:20.14.0-alpine3.20`, `nginx:1.27.0-alpine`).
  2. Multi-stage build pattern separates compilation tools from production runners.
  3. Execution under least-privilege non-root users (`node`, `nginx`).
  4. Built-in `HEALTHCHECK` instructions polling `/api/health` and `/healthz`.
  5. Standard OpenContainers (OCI) image annotations.

---

### US-09: POSIX Automation Scripts for Environment Maintenance
- **As a** Unix/Linux Developer,
- **I want** portable bash scripts with strict error handling (`set -euo pipefail`),
- **So that** setup, testing, linting, and building can be executed with a single command on any POSIX terminal.
- **Acceptance Criteria**:
  1. Scripts provided: `scripts/setup.sh`, `scripts/test.sh`, `scripts/lint.sh`, `scripts/build.sh`, `scripts/docker-run.sh`.
  2. Scripts exit immediately on failure (`-e`) with informative colored terminal messages.
  3. Docker script checks daemon availability before attempting container execution.

---

### US-10: Continuous Integration Pipeline with Container Build Verification
- **As a** DevOps Engineer,
- **I want** a GitHub Actions workflow triggered on push and pull requests,
- **So that** code quality gates, test suites, and container builds are continuously validated on remote runners.
- **Acceptance Criteria**:
  1. Parallel jobs for backend quality (ESLint, Vitest, build) and frontend quality (ESLint, Karma, build).
  2. Container build job verifies multi-stage Dockerfiles build successfully via Buildx.
  3. Concurrency cancellation prevents redundant runs on updated PR branches.

---

### US-11: Azure DevOps Pipeline for Enterprise Cloud Release
- **As an** Enterprise Infrastructure Engineer,
- **I want** an Azure DevOps YAML pipeline definition mirroring the CI validation and packaging stages,
- **So that** the application can be onboarded into Microsoft Azure DevOps release management.
- **Acceptance Criteria**:
  1. `azure-pipelines.yml` defines `ContinuousIntegration` and `ContainerPackaging` stages.
  2. Node 20 environment configured with parallel quality jobs.
  3. Explicitly noted as authored and verified, marked as "Not yet run on Azure DevOps" until an Azure DevOps organization is connected.
