# 0001. Architecture Decision Record: Frontend State Management Architecture

- **Status**: Accepted
- **Deciders**: Full Stack Engineering (Antigravity Solo Developer)
- **Date**: 2026-10-13
- **Technical Context**: BlackRock Associate Full Stack Developer Alignment (Angular 18, RxJS, NgRx, Enterprise Web Apps)

---

## 1. Context and Problem Statement
The EnergyOps Workflow Platform orchestrates complex multi-stage energy installation contracts (9 sequential lifecycle stages, active blocker dependencies, role-scoped overrides, and operational alerting).

Prior to this upgrade:
1. State was held in fragmented singleton service `BehaviorSubject` instances across `JobService`, `AlertService`, and `MetricsService`.
2. Components made direct imperative `.subscribe()` calls without unified lifecycle management or unsubscription strategy (`takeUntilDestroyed`).
3. Component templates and UI methods performed local mutations and duplicated transition logic.
4. Loading indicators, error banners, and empty states were inconsistently presented.
5. The BlackRock Mumbai Full Stack JD specifically requires:
   > "Core JavaScript and at least one library such as RxJS or NgRx... clean, future-proof code with proper unit testing."

We needed a robust, predictable, and enterprise-grade state management solution for job contracts and stage transitions.

---

## 2. Decision
We have chosen **NgRx Store (@ngrx/store and @ngrx/effects)** as the primary state management architecture for the EnergyOps platform, complemented by **RxJS Reactive Streams**:

1. **Actions (`job.actions.ts`)**: Strongly typed, descriptive action dispatches representing all workflow events:
   - `[Job] Load Jobs` / `[Job] Load Jobs Success` / `[Job] Load Jobs Failure`
   - `[Job] Load Job Detail` / `[Job] Load Job Detail Success`
   - `[Job] Update Job Stage` / `[Job] Update Job Stage Success` / `[Job] Update Job Stage Failure`
   - `[Job] Update Job Status` / `[Job] Resolve Blocker` / `[Job] Create Job`
2. **Reducer (`job.reducer.ts`)**: Pure, immutable state transformations using `createReducer` and `on(...)`. State maintains jobs list, selected active job, loading flag, error messages, and search/filter criteria.
3. **Selectors (`job.selectors.ts`)**: Memoized projection functions (`selectAllJobs`, `selectJobsLoading`, `selectJobsError`, `selectJobsByStage`, `selectBlockedJobs`, `selectFilteredJobs`).
4. **Effects (`job.effects.ts`)**: Isolation of asynchronous HTTP REST communication, error translation, and toast notification side-effects from UI presentation components.
5. **Validation Rules**: All stage transitions continue to be enforced through backend workflow rules (`validateStageTransition`). Non-admin sequential skips and blocked job advancements are rejected and captured by `updateJobStageFailure`.
6. **UI State Visibility**: Kanban board and job detail components expose dedicated loading skeletons, empty swimlane states, and accessible error banners.

---

## 3. Alternatives Considered

### Option A: Ad-Hoc Service BehaviorSubjects (Status Quo)
- **Pros**: Zero third-party state libraries.
- **Cons**: Prone to race conditions, state duplication, un-trackable mutations, high boilerplate for memoized queries, difficult to unit test with complete coverage. Rejected.

### Option B: Angular Signals (SignalStore)
- **Pros**: Native reactive primitives in Angular 18.
- **Cons**: Lacks out-of-the-box Redux DevTools integration, does not satisfy the JD explicit emphasis on NgRx/RxJS enterprise patterns.

### Option C: NgRx Store + Effects (Selected)
- **Pros**:
  - Direct alignment with BlackRock's financial services frontend architectural standards (predictable unidirectional data flow, immutability, auditability).
  - Clean separation of concerns (UI components contain zero HTTP calls or business logic).
  - Highly testable reducers and effects using marble testing and isolated unit tests.
  - Built-in error and loading state tracking.
- **Cons**:
  - Additional boilerplate for action and effect declarations (mitigated through modern creator functions `createAction`, `createReducer`, `createEffect`).

---

## 4. Consequences
- **Positive**: Components are purely presentational/smart containers that select streams via `async` pipes and dispatch actions.
- **Positive**: Complete auditability of state changes; errors from backend validation (e.g. invalid non-sequential stage transition) are captured into the store and displayed in UI banners.
- **Positive**: State logic is 100% testable without instantiating DOM fixtures.
- **Compliance**: Adheres to BlackRock frontend coding standards and architecture guidelines.
