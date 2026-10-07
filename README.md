# ⚡ EnergyOps – Enterprise Installation Workflow & Operations Platform

<div align="center">

[![Live Streamlit App](https://img.shields.io/badge/Live_Demo-Streamlit_Cloud-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://energyops-workflow-platform-mcwfe3b7hcmhuf7ykaxetd.streamlit.app/)
[![Angular 18](https://img.shields.io/badge/Frontend-Angular_18-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite_3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Tests Passed](https://img.shields.io/badge/Tests-11_Passed_Vitest-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

**Enterprise-Grade Clean Energy Installation Operations, Kanban Pipeline & Telemetry Engine**

[🌐 **Explore Live Cloud App**](https://energyops-workflow-platform-mcwfe3b7hcmhuf7ykaxetd.streamlit.app/) • [📂 **GitHub Repository**](https://github.com/Dhanya562004/energyops-workflow-platform.git)

---
</div>

## 📌 Executive Overview & Problem Statement

Clean energy installation enterprises (Commercial Solar, Microgrid Systems, Industrial Battery Storage, EV Charging Infrastructure, Wind Turbines) require strict lifecycle management. Standard CRUD dashboards fail to address real-world operational challenges:

1. **Strict Stage Transition Validation**: Advancing a job before completing engineering design reviews or securing municipal permits results in site re-work and compliance fines.
2. **Incident & Blocker Escalation**: Supply-chain stalls, utility interconnect delays, and roof reinforcement requirements demand automatic alert dispatching (>24h blocked).
3. **Multi-Role Governance**: Admins, Operational Managers, and Field Lead Engineers require role-scoped actions (e.g. stage sequence overrides vs field progress logging).
4. **Real-Time Observability**: Tracking labor-hour budget variances, permit overdue risks, and API endpoint response latencies.

**EnergyOps** addresses these enterprise challenges as a full-stack engineering platform combining an **Angular 18 SPA**, a **Node.js/Express TypeScript REST & GraphQL API server**, a **relational SQLite database**, and a **Python Streamlit Executive Dashboard** deployed on Streamlit Cloud with secure Streamlit Secrets (`st.secrets["ENERGYOPS_API_KEY"]`).

---

## 🌟 Key Platform Features

| Feature Module | Capabilities |
| :--- | :--- |
| **📊 Executive Command Center** | Real-time KPI cards (Active, Completed, Delayed, Blocked jobs, Avg Cycle Time), interactive Plotly stage breakdown & status distribution charts, filterable table. |
| **🗂️ Kanban Workflow Pipeline** | 9 swimlane columns (`Site Assessment` ➔ `Completion`) with stage transition validation, blocker indicators, and instant sync. |
| **📋 Jobs Registry** | Master contract database, filtering by product/engineer/stage/status, and interactive form to create & publish new installation contracts. |
| **🚨 Operational Incidents** | Real-time incident desk detecting blocked jobs, overdue permits, and cost overruns with 1-click acknowledgement. |
| **📈 System Telemetry** | API throughput counters, success rate %, average latency percentiles, client error interceptor logs, and telemetry simulation tools. |
| **👥 Role-Based Governance** | Simulated role switching between **Admin** (stage override), **Manager** (approvals & blocker resolution), and **Engineer** (field progress logging). |

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TB
    subgraph StreamlitCloud["Streamlit Community Cloud Deployment"]
        stApp["Python Streamlit App (app.py)"]
        stSecrets["st.secrets (ENERGYOPS_API_KEY: AQ.Ab...)"]
        stPlotly["Plotly Executive Analytics"]
    end

    subgraph AngularClient["Angular 18 Enterprise Client"]
        Navbar["Navbar & Role Switcher (Admin / Manager / Engineer)"]
        Dash["Command Center Dashboard"]
        Kanban["Kanban Drag & Drop Board (@angular/cdk)"]
        Detail["Job Detail Stepper & Audit Log"]
        AlertsUI["Operational Alerts Desk"]
        MetricsUI["System Telemetry & Latency Metrics"]
        Interceptor["HTTP Error Interceptor"]
    end

    subgraph NodeBackend["Node.js / Express TypeScript API"]
        Router["REST Router (/api/jobs, /api/alerts, /api/metrics)"]
        GraphQL["GraphQL Query Engine (/graphql)"]
        Validator["Workflow Stage Transition Validator"]
        MetricsMw["Request Latency Telemetry Middleware"]
        ErrMw["Centralized Error Handler"]
    end

    subgraph RelationalDB["SQLite Storage (energyops.db)"]
        Jobs[("jobs (25+ contracts)")]
        Users[("users (Admin/Manager/Engineer)")]
        History[("job_history (Audit Trail)")]
        Blockers[("blockers (Active & Resolved)")]
        Alerts[("alerts (Operational Incidents)")]
        Metrics[("metrics (HTTP Latency Stats)")]
        Notes[("job_notes (Field Comments)")]
    end

    stApp --> stSecrets
    stApp --> RelationalDB
    AngularClient -->|REST HTTP / JSON| Router
    AngularClient -->|GraphQL Queries| GraphQL
    Router --> MetricsMw
    MetricsMw --> Validator
    Validator --> Jobs
    Validator --> History
    Validator --> Blockers
    Validator --> Alerts
    MetricsMw --> Metrics
```

---

## 🔄 9 Lifecycle Stages & Workflow Rules

```mermaid
stateDiagram-v2
    [*] --> SiteAssessment: Contract Signed
    SiteAssessment --> SystemDesign: Site Survey Complete
    SystemDesign --> DesignReview: Schematics Submitted
    DesignReview --> PermitSubmission: PE Stamp Approved
    PermitSubmission --> PermitApproval: Municipal Review
    PermitApproval --> Scheduling: Permit Granted
    Scheduling --> Installation: Crew Assigned
    Installation --> Inspection: Hardware Deployed
    Inspection --> Completion: Grid Interconnect Signed
    Completion --> [*]: System Commissioned

    state BlockedStatus {
        [*] --> BlockerFlagged: Supply Delay / Grid Capacity / Permit Revision
        BlockerFlagged --> BlockerResolved: Management Action Taken
    }
```

### 9 Sequential Workflow Stages
1. **Site Assessment** ➔ 2. **System Design** ➔ 3. **Design Review** ➔ 4. **Permit Submission** ➔ 5. **Permit Approval** ➔ 6. **Scheduling** ➔ 7. **Installation** ➔ 8. **Inspection** ➔ 9. **Completion**

### Workflow Validation Rules
- **Sequential Guard**: Non-admin users must advance stages sequentially (e.g. Stage 2 ➔ Stage 3). Skipping stages without Admin authorization is rejected (400 Bad Request).
- **Blocker Lockout**: If a job status is set to `Blocked`, stage advancement is locked until active blockers are resolved.
- **Admin Override**: Admin role can override workflow sequence with audit history recording.

---

## 🛠️ Technology Stack Breakdown

### Frontend & Executive Apps
- **Streamlit (Python 3.13)**: Deployed on Streamlit Cloud, Plotly charts, Streamlit Secrets integration.
- **Angular 18+**: Standalone Components, Signals / RxJS Streams, Reactive Forms.
- **Styling**: SCSS Design System with CSS Custom Variables, Dark & Light Mode toggle.
- **Drag & Drop**: `@angular/cdk/drag-drop` (Kanban Board Interaction).

### Backend & Storage
- **Node.js v22+ & Express.js**: TypeScript server architecture (`ts-node`).
- **SQLite (`better-sqlite3`)**: Relational database engine with foreign key enforcement and indexes.
- **APIs**: REST API + Bonus GraphQL Query Endpoint (`/graphql`).
- **Testing**: Vitest + Supertest (11 passing integration tests).

---

## 🛰️ REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/jobs` | Search, filter (status, stage, engineer, priority), sort, and paginate jobs. |
| `GET` | `/api/jobs/:id` | Fetch job details with complete history audit trail, blockers, and notes. |
| `POST` | `/api/jobs` | Initialize a new installation job contract. |
| `PUT` | `/api/jobs/:id` | Full update of job specifications and labor estimates. |
| `PATCH` | `/api/jobs/:id/stage` | Transition workflow stage with validation check & audit trail. |
| `PATCH` | `/api/jobs/:id/status` | Update status (flags blocker if status is `Blocked`). |
| `POST` | `/api/jobs/:id/blockers` | Flag an operational blocker and lock job status. |
| `PATCH` | `/api/blockers/:id/resolve` | Resolve an active blocker and automatically resume job. |
| `GET` | `/api/alerts` | Retrieve active operational alerts and incidents summary. |
| `PATCH` | `/api/alerts/:id/acknowledge` | Mark an alert as acknowledged. |
| `GET` | `/api/metrics` | Returns live system metrics, latency percentiles, and error counts. |
| `POST` | `/graphql` | Execute GraphQL queries. |

---

## ⚛️ GraphQL Endpoint Examples (`POST /graphql`)

```graphql
query GetHighPrioritySolarJobs {
  jobs(status: "In Progress", priority: "High") {
    id
    customerName
    currentStage
    assignedEngineer
    installationProgress
    targetCompletionDate
    blockers {
      reason
      status
    }
  }
  metrics {
    totalRequests
    successRate
    avgLatencyMs
    version
  }
}
```

---

## 🔐 Streamlit Secrets Configuration Guide

To configure secrets on **Streamlit Community Cloud**:

1. Go to [share.streamlit.io](https://share.streamlit.io) and open your app settings.
2. Go to **App Settings** -> **Secrets**.
3. Paste your configuration starting with your `AQ.Ab...` format API key:

```toml
ENERGYOPS_API_KEY = "AQ.Ab1234567890abcdefghijklmnopqrstuvwxyz"
BACKEND_URL = "https://your-express-backend.render.com/api"
ENVIRONMENT = "production"
```

4. Click **Save**. The Streamlit app detects `st.secrets["ENERGYOPS_API_KEY"]` automatically!

---

## 🧪 Testing Suite (11 Passing Tests)

```bash
cd backend
npm test
```

### Verified Test Cases:
1. `GET /api/jobs` pagination metadata verification.
2. Filter jobs by status (`In Progress`).
3. Retrieve single job with relations (history, blockers, alerts).
4. Create new job with default stage assignment.
5. Valid sequential stage transition execution.
6. Rejection of invalid stage skipping (400 Bad Request).
7. Flagging job blocker and verifying automatic status lock.
8. Resolving blocker and verifying automatic job resume.
9. Fetching active operational alerts.
10. Fetching system performance metrics.
11. GraphQL query resolution.

---

## 📊 How This Project Maps to a Real Internal Operations Platform

In clean energy companies (e.g., Tesla Energy, Sunrun, NextEra Energy, ChargePoint):
1. **Stage Gates prevent costly site errors**: Field crews cannot order high-voltage equipment until site assessment and engineering permit approval are completed in software.
2. **Audit Trails ensure compliance**: Municipal agencies require documented histories of who approved electrical schematics and when structural building permits were granted.
3. **Telemetry & Observability protect SLAs**: System performance dashboards notify site reliability engineers if backend endpoints slow down or if job target completion dates fall behind schedule.

---

## 🚀 Local Quickstart Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed      # Seeds 25+ realistic energy installation contracts
npm start         # Express API runs on http://localhost:3000
```

### 2. Angular Frontend Setup
```bash
cd frontend
npm install
npm start         # Angular CLI dev server runs on http://localhost:4200
```

### 3. Streamlit App Local Setup
```bash
pip install -r requirements.txt
streamlit run app.py
```

---

## 📄 License
MIT © Dhanya K / EnergyOps Platform Engineering
