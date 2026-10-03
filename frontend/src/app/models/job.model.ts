export type WorkflowStage =
  | 'Site Assessment'
  | 'System Design'
  | 'Design Review'
  | 'Permit Submission'
  | 'Permit Approval'
  | 'Scheduling'
  | 'Installation'
  | 'Inspection'
  | 'Completion';

export type WorkflowStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Completed'
  | 'Delayed';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type PermitStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Revision Required' | 'N/A';

export const WORKFLOW_STAGES: WorkflowStage[] = [
  'Site Assessment',
  'System Design',
  'Design Review',
  'Permit Submission',
  'Permit Approval',
  'Scheduling',
  'Installation',
  'Inspection',
  'Completion'
];

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  'Not Started',
  'In Progress',
  'Blocked',
  'Completed',
  'Delayed'
];

export const PRODUCT_TYPES = [
  'Commercial Solar',
  'Residential Battery Storage',
  'Microgrid System',
  'EV Charging Hub',
  'Industrial Wind Turbine',
  'Industrial Battery Storage'
];

export interface JobHistory {
  id: string;
  jobId: string;
  previousStage: string | null;
  newStage: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string;
  changeReason: string | null;
  createdAt: string;
}

export interface Blocker {
  id: string;
  jobId: string;
  reason: string;
  status: 'Active' | 'Resolved';
  createdBy: string;
  createdAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

export interface JobNote {
  id: string;
  jobId: string;
  author: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Job {
  id: string;
  customerName: string;
  siteAddress: string;
  productType: string;
  assignedEngineer: string;
  assignedManager: string;
  currentStage: WorkflowStage;
  status: WorkflowStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  targetCompletionDate: string;
  blockerReason: string | null;
  permitStatus: PermitStatus;
  installationProgress: number;
  estimatedHours: number;
  actualHours: number;
  history?: JobHistory[];
  blockers?: Blocker[];
  notes?: JobNote[];
}

export interface JobPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  delayedJobs: number;
  blockedJobs: number;
  avgHours: number;
}

export interface JobQueryParams {
  search?: string;
  status?: string;
  stage?: string;
  engineer?: string;
  manager?: string;
  priority?: string;
  productType?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}
