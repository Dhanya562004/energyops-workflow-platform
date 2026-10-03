export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'Active' | 'Acknowledged';

export interface OperationalAlert {
  id: string;
  jobId: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  customerName?: string;
  currentStage?: string;
  assignedEngineer?: string;
  jobPriority?: string;
}

export interface AlertSummary {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
}
