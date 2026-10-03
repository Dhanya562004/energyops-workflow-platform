CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Engineer')),
  avatarUrl TEXT
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  siteAddress TEXT NOT NULL,
  productType TEXT NOT NULL,
  assignedEngineer TEXT NOT NULL,
  assignedManager TEXT NOT NULL,
  currentStage TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  targetCompletionDate TEXT NOT NULL,
  blockerReason TEXT,
  permitStatus TEXT NOT NULL,
  installationProgress INTEGER NOT NULL DEFAULT 0,
  estimatedHours REAL NOT NULL,
  actualHours REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_history (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL,
  previousStage TEXT,
  newStage TEXT NOT NULL,
  previousStatus TEXT,
  newStatus TEXT NOT NULL,
  changedBy TEXT NOT NULL,
  changeReason TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blockers (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Resolved')),
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  resolvedBy TEXT,
  resolvedAt TEXT,
  resolutionNotes TEXT,
  FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Acknowledged')),
  createdAt TEXT NOT NULL,
  acknowledgedAt TEXT,
  acknowledgedBy TEXT,
  FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  latencyMs REAL NOT NULL,
  statusCode INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  success INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS job_notes (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON jobs(currentStage);
CREATE INDEX IF NOT EXISTS idx_jobs_engineer ON jobs(assignedEngineer);
CREATE INDEX IF NOT EXISTS idx_job_history_jobId ON job_history(jobId);
CREATE INDEX IF NOT EXISTS idx_blockers_jobId ON blockers(jobId);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
