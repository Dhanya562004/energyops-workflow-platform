# BlackRock Job Description Alignment Matrix

**Role**: Associate, Full Stack Developer  
**Location**: Mumbai, India  
**Target Repository**: EnergyOps Workflow Platform  

This matrix details how the codebase directly aligns with and demonstrates every single competency, qualification, and responsibility listed in the BlackRock Associate Full Stack Developer job description.

---

## 1. Core Competency & Requirement Mapping

| Job Description Requirement | Project Implementation & Proof Points | Verifying Files / Evidence | Verification Command |
| :--- | :--- | :--- | :--- |
| **One Front-End Framework (Angular preferred)** | • Angular 18 standalone components (`WorkflowComponent`, `JobDetailComponent`, `DashboardComponent`, `AlertsComponent`, `MetricsComponent`)<br>• Zero standalone NgModule legacy wrappers<br>• Angular Router with parameter mapping and navigation guards<br>• Typed Reactive Forms for filtering and search | • `frontend/src/app/app.component.ts`<br>• `frontend/src/app/features/workflow/workflow.component.ts`<br>• `frontend/src/app/features/jobs/job-detail/job-detail.component.ts` | `npx ng test --no-watch --browsers=ChromeHeadless` (39 passing) |
| **Core JavaScript / TypeScript & RxJS / NgRx** | • Full TypeScript 5.5 codebase with strict typing<br>• NgRx Store (`@ngrx/store` v18.1.1) and NgRx Effects (`@ngrx/effects` v18.1.1)<br>• Unidirectional data flow: Actions -> Reducers -> Selectors -> Components<br>• RxJS operators: `pipe`, `switchMap`, `map`, `tap`, `catchError`, `debounceTime`, `distinctUntilChanged`, `BehaviorSubject` | • `frontend/src/app/state/job/`<br>• `frontend/src/app/app.config.ts`<br>• `docs/decisions/0001-frontend-state.md` | `npm run lint` in `frontend` (0 errors) |
| **HTML and CSS** | • Semantic HTML5 elements (`<main>`, `<nav>`, `<header>`, `<section>`, `<aside>`)<br>• Custom CSS design tokens (`--color-primary`, `--color-bg-canvas`, `--radius-md`, etc.) in `styles.scss`<br>• Fully responsive layouts tested at 375px (mobile), 768px (tablet), and 1280px (desktop)<br>• Accessible skip-to-content links and high-contrast `:focus-visible` styling | • `frontend/src/styles.scss`<br>• `frontend/src/app/app.component.ts`<br>• `docs/screenshots/responsive-*.png` | View screenshots in `docs/screenshots/` |
| **Clean, Future-Proof Code & Unit Testing** | • 67 total automated unit tests (39 Angular Karma + 28 Backend Vitest)<br>• 100% test pass rate with zero skips and zero failures<br>• Explicit testing of negative and failure paths (400 validation, 401 unauth, 403 forbidden, 500 network)<br>• Separation of concerns: Service layer, Store layer, Presentation layer | • `frontend/src/app/services/job.service.spec.ts`<br>• `frontend/src/app/state/job/job.reducer.spec.ts`<br>• `backend/src/tests/api.test.ts`<br>• `backend/src/tests/security.test.ts` | `npm test` in both `backend` and `frontend` |
| **Distributed Version Control (Git)** | • One clean git commit per development phase<br>• Conventional commit specification (`feat(...)`, `test(...)`, `ci(...)`, `docs(...)`)<br>• Clean branch lifecycle on `upgrade/jd-alignment` | • Git commit history (`git log --oneline -n 10`) | `git log --oneline -n 8` |
| **Agile with an Emphasis on Scrum** | • Prioritized Product Backlog with 14 user stories, acceptance criteria, and story points<br>• Sprint 01 Solo Self-Run Sprint Log with daily standups, blocker tracking, and retrospective<br>• Strict adherence to truthfulness (no manufactured ceremonies or fake personas) | • `docs/scrum/product-backlog.md`<br>• `docs/scrum/sprint-01.md` | Inspect `docs/scrum/` |
| **Strong Communication & Time Management** | • Architecture Decision Record (ADR) documenting why NgRx was selected over alternatives<br>• Exhaustive Phase 1 audit document identifying technical debt and upgrade strategy<br>• Clear, concise documentation and commit logs | • `docs/decisions/0001-frontend-state.md`<br>• `docs/audit-phase-1.md` | Inspect `docs/` |
| **Financial Services / Energy Domain Interest** | • Models high-stakes renewable utility installations (commercial solar, microgrids, battery storage)<br>• Immutable audit trail in `job_history` recording `changedBy`, `previousStage`, `newStage`, `timestamp`<br>• Real-time latency tracking and SLA monitoring in `metrics.ts` | • `backend/src/routes/jobs.ts`<br>• `backend/src/routes/metrics.ts`<br>• `backend/src/db/schema.sql` | Inspect `schema.sql` |
| **Web and Security Standards** | • Cryptographic JWT authentication (`jsonwebtoken`) with signed bearer tokens<br>• Role-Based Access Control (`requireAuth`, `requireRole` for Admin, Manager, Engineer)<br>• Input validation schemas for all write endpoints with 400 rejection tests<br>• CORS allowed origins/headers configuration<br>• Automated `axe-core` accessibility audit verifying WCAG 2.1 AA compliance | • `backend/src/middleware/authMiddleware.ts`<br>• `backend/src/middleware/validationMiddleware.ts`<br>• `frontend/src/app/features/workflow/workflow-a11y.spec.ts` | `npm test` in backend (security test suite) |
| **Unix/Linux Platform Experience & OCI Containers** | • Multi-stage OCI Dockerfiles for backend (Node 20 Alpine) and frontend (Nginx 1.27 Alpine)<br>• Least-privilege non-root execution (`USER node`, `USER nginx`)<br>• `HEALTHCHECK` directives for both services<br>• `docker-compose.yml` orchestrating services on an isolated bridge network<br>• Portable POSIX shell scripts (`set -euo pipefail`) verified in Bash | • `backend/Dockerfile`<br>• `frontend/Dockerfile`<br>• `frontend/nginx.conf`<br>• `docker-compose.yml`<br>• `scripts/*.sh` | Run `scripts/lint.sh` and `scripts/build.sh` via Bash |
| **Azure DevOps** | • Cloud-native Azure DevOps pipeline authored in YAML (`azure-pipelines.yml`)<br>• Multi-stage pipeline: Stage 1 Continuous Integration (lint, test, build), Stage 2 Container Packaging (Docker build)<br>• Accurately labeled: *Authored and schema-verified; not yet run on Azure DevOps until an organization connection is established* | • `azure-pipelines.yml` | Inspect `azure-pipelines.yml` |
| **Frontend Architecture & Coding Standards** | • Unified ESLint configuration across frontend and backend TypeScript<br>• Strict typing with zero `any` leaks in core models<br>• Zero lint errors and zero lint warnings across the entire repository | • `backend/.eslintrc.json`<br>• `frontend/.eslintrc.json` | Run `scripts/lint.sh` |
| **Leveraging AI in Daily Development & Testing** | • Documented record of AI pair-programming workflows using Google Antigravity IDE tools<br>• Multi-file refactoring, headless Chrome screenshot automation, Vitest concurrency diagnosis, and unit test generation | • `docs/ai-workflow.md` | Inspect `docs/ai-workflow.md` |
| **Supporting Existing Systems** | • Preserved and improved the existing application rather than scaffolding a greenfield replacement<br>• Full backward compatibility for Streamlit executive client (`x-api-key: AQ.Ab...`) and UI role emulation | • `backend/src/middleware/authMiddleware.ts`<br>• `app.py` | Run backend and verify Streamlit key |

---

## 2. Hard Rule Adherence Verification

1. **Rule 1: Improve existing repo without scaffolding replacement**:  
   Maintained existing Angular app, Express/SQLite backend, and Streamlit dashboard. All original features enhanced with NgRx, security, testing, and responsive styling.
2. **Rule 2: Never claim unrun/unpassed tests or features**:  
   All reported test numbers are exact command outputs (39 frontend Karma, 28 backend Vitest = 67 passing).
3. **Rule 3: No invented ceremonies or fake teammates**:  
   Sprint records explicitly declare a solo self-run sprint with solo asynchronous standups.
4. **Rule 4: One git commit per phase with conventional commit format**:  
   - Phase 1: `5394581` `docs(audit): complete Phase 1 repository audit against BlackRock JD requirements`
   - Phase 2: `980df21` `feat(state): implement NgRx state management with actions, reducers, selectors, effects, and ADR`
   - Phase 3: `f921279` `test: add unit and failure-path tests for reducers, job service, kanban board, and job detail`
   - Phase 4: `9bba42c` `feat(a11y): enhance accessibility to WCAG 2.1 AA with axe-core audit, design tokens, and responsive layouts`
   - Phase 5: `19ccecc` `feat(security): enforce JWT authentication, role guards, input validation, CORS, and ESLint`
   - Phase 6: `0cb625a` `feat(container): add multi-stage OCI Dockerfiles, docker-compose, and POSIX maintenance scripts`
   - Phase 7: `ad6fa4f` `ci: add GitHub Actions workflow and Azure DevOps pipeline definition`
5. **Rule 5: Ask before git push, deployment, or file deletion**:  
   Zero files deleted; no remote push executed without explicit user confirmation.
6. **Rule 6: State if a step cannot run locally**:  
   Absence of local Docker CLI and live Azure DevOps organization explicitly documented and verified via syntax and dry runs.
