# Leveraging AI in Daily Development & Testing

This document provides a transparent, factual record of how Artificial Intelligence (Google DeepMind Antigravity agentic pair-programming assistant) was leveraged during the development, testing, and cloud-native upgrade of the **EnergyOps Workflow Platform**.

---

## 1. AI Tooling & Operating Model

Development was executed as an iterative pair-programming engagement between a human engineer and the Antigravity agentic assistant running in the local workspace.

### Tool Suite Utilized
| Tool | Purpose & Usage in Project |
| :--- | :--- |
| `grep_search` & `list_dir` | Rapid codebase indexing, finding legacy NgRx/RxJS patterns, and auditing component hierarchies. |
| `view_file` | Reviewing complete file implementations without truncation to ensure existing functionality was preserved. |
| `replace_file_content` | Precision modifications to code without replacing entire scaffolds or wiping unrelated comments. |
| `write_to_file` | Creating new architectural artifacts (ADRs, test suites, Dockerfiles, POSIX scripts). |
| `run_command` & `manage_task` | Synchronous and asynchronous execution of builds, test runners, linters, and headless browser processes. |

---

## 2. Key Engineering Tasks Accelerated by AI

### A. NgRx State Architecture Design
- **Prompt / Objective**: Implement unidirectional state management for the Kanban board and Job Detail views to eliminate race conditions and template business logic.
- **AI Contribution**: Designed the complete NgRx feature slice (`job.actions.ts`, `job.state.ts`, `job.reducer.ts`, `job.selectors.ts`, `job.effects.ts`), wrote the Architecture Decision Record (`docs/decisions/0001-frontend-state.md`), and ensured full compatibility with Angular 18 standalone component bootstrapping (`provideStore`, `provideEffects`).
- **Human / AI Validation**: Ran `npm test` verifying 10 reducer unit tests and component state subscriptions.

### B. Unit Testing & Failure-Path Expansion
- **Prompt / Objective**: Expand unit testing coverage from basic smoke tests to robust positive and negative failure paths across frontend services, reducers, and backend routes.
- **AI Contribution**: Authored `job.service.spec.ts` using `HttpClientTestingModule` to assert 400 validation, 403 forbidden, and 500 network error paths. Authored `security.test.ts` asserting JWT invalidation, role violations, and validation schema rejections.
- **Debugged Challenge**: When running tests, Angular CLI hung indefinitely due to `--watch=false` in certain Karma versions. The AI diagnosed the runner configuration and switched to `--no-watch --browsers=ChromeHeadless`, resolving the hang.

### C. Automated Accessibility Auditing
- **Prompt / Objective**: Achieve and certify WCAG 2.1 AA compliance across core workflows.
- **AI Contribution**: Integrated `axe-core` into the Karma test pipeline (`workflow-a11y.spec.ts`) to programmatically scan the rendered Kanban board DOM. Added design tokens for `:focus-visible` with high-contrast outlines (3px solid `#0284c7`, 2px offset).
- **Result**: Automated audit runs in CI with 0 violations.

### D. Concurrency Issue in SQLite / Vitest
- **Prompt / Objective**: Execute backend test suite containing integration and security tests.
- **Challenge Encountered**: When both `api.test.ts` and `security.test.ts` ran simultaneously, Vitest's default thread pool caused concurrent SQLite write collisions (`database locked` / state desynchronization during `beforeAll` seeding).
- **AI Diagnosis & Fix**: Authored `backend/vitest.config.ts` specifying `fileParallelism: false`. Tests now run sequentially in single-threaded mode against the SQLite file, reaching a 100% pass rate (28/28 tests passed).

### E. OCI Containerization & Multi-Platform Scripting
- **Prompt / Objective**: Author enterprise-grade OCI container configurations and POSIX maintenance scripts.
- **AI Contribution**: Authored multi-stage Dockerfiles with Alpine base images, least-privilege non-root users (`node`, `nginx`), healthcheck probes, and standard OCI labels. Wrote POSIX bash scripts with strict flags (`set -euo pipefail`) and verified execution via Git Bash.

---

## 3. Best Practices for AI-Assisted Engineering

1. **Verify with Real Command Execution**: Never accept an AI's assertion that code works without inspecting real command terminal outputs (real exit codes, exact test counts).
2. **Preserve Existing Business Logic**: Use targeted AST or diff replacement tools rather than allowing an AI to regenerate entire files from scratch.
3. **Transparent Accountability**: Accurately label solo workflows, unverified environments (e.g. local Docker daemon absence), and technical constraints.
