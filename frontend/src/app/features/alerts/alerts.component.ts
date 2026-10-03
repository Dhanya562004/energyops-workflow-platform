import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { ToastService } from '../../core/services/toast.service';
import { OperationalAlert } from '../../models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="alerts-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Operational Monitoring & Incidents</h1>
          <p class="page-subtitle">Real-time alert engine detecting blocked installations, overdue permits, and SLA variances.</p>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filter-bar card">
        <div class="filter-group">
          <label class="filter-label">Filter Status:</label>
          <select [(ngModel)]="statusFilter" (change)="loadAlerts()" class="select-input">
            <option value="All">All Alerts</option>
            <option value="Active">Active Only</option>
            <option value="Acknowledged">Acknowledged Only</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Filter Severity:</label>
          <select [(ngModel)]="severityFilter" (change)="loadAlerts()" class="select-input">
            <option value="All">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <!-- Alerts List -->
      <div class="alerts-list">
        <div 
          *ngFor="let alert of alerts" 
          class="alert-card"
          [ngClass]="[alert.severity.toLowerCase(), alert.status.toLowerCase()]"
        >
          <div class="alert-icon-col">
            <span *ngIf="alert.severity === 'CRITICAL'">🚨</span>
            <span *ngIf="alert.severity === 'HIGH'">⚠️</span>
            <span *ngIf="alert.severity === 'MEDIUM'">⚡</span>
            <span *ngIf="alert.severity === 'LOW'">ℹ️</span>
          </div>

          <div class="alert-body-col">
            <div class="alert-top-row">
              <span class="severity-badge" [ngClass]="alert.severity.toLowerCase()">{{ alert.severity }}</span>
              <span class="alert-type">{{ alert.type }}</span>
              <a [routerLink]="['/jobs', alert.jobId]" class="job-id-tag">Job {{ alert.jobId }}</a>
              <span class="alert-time">{{ alert.createdAt | date:'medium' }}</span>
            </div>

            <div class="alert-message">{{ alert.message }}</div>

            <div class="alert-sub-meta" *ngIf="alert.customerName">
              Customer: <strong>{{ alert.customerName }}</strong> • Stage: {{ alert.currentStage }} • Engineer: {{ alert.assignedEngineer }}
            </div>
          </div>

          <div class="alert-action-col">
            <button 
              *ngIf="alert.status === 'Active'" 
              class="btn btn-ack" 
              (click)="acknowledge(alert.id)"
            >
              Acknowledge Alert
            </button>
            <div *ngIf="alert.status === 'Acknowledged'" class="acked-info">
              <span class="ack-check">✓ Acknowledged</span>
              <span class="ack-by">by {{ alert.acknowledgedBy }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="alerts.length === 0" class="empty-alerts card">
          <span>🎉 No operational alerts match your criteria. All installation workflows running smoothly!</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alerts-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main, #f8fafc); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); }

    .filter-bar {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      padding: 14px 18px;
      border-radius: 12px;
      display: flex;
      gap: 20px;
    }
    .filter-group { display: flex; align-items: center; gap: 8px; }
    .filter-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted, #94a3b8); }
    .select-input {
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
    }

    .alerts-list { display: flex; flex-direction: column; gap: 14px; }
    .alert-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      &.critical { border-left: 5px solid #ef4444; }
      &.high { border-left: 5px solid #f59e0b; }
      &.medium { border-left: 5px solid #3b82f6; }
      &.low { border-left: 5px solid #94a3b8; }
      &.acknowledged { opacity: 0.7; }
    }
    .alert-icon-col { font-size: 1.5rem; }
    .alert-body-col { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .alert-top-row { display: flex; align-items: center; gap: 10px; }
    .severity-badge {
      font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
      &.critical { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      &.high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
      &.medium { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
      &.low { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    }
    .alert-type { font-weight: 700; font-size: 0.88rem; color: var(--text-main, #f8fafc); }
    .job-id-tag { color: #38bdf8; font-weight: 700; text-decoration: none; font-size: 0.8rem; }
    .alert-time { font-size: 0.75rem; color: var(--text-muted, #94a3b8); margin-left: auto; }
    .alert-message { font-size: 0.88rem; color: var(--text-main, #f8fafc); font-weight: 600; }
    .alert-sub-meta { font-size: 0.75rem; color: var(--text-muted, #94a3b8); }

    .btn-ack {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: rgba(59, 130, 246, 0.3); }
    }
    .acked-info { display: flex; flex-direction: column; align-items: flex-end; }
    .ack-check { color: #10b981; font-weight: 700; font-size: 0.8rem; }
    .ack-by { font-size: 0.7rem; color: var(--text-muted, #94a3b8); }
    .empty-alerts { text-align: center; padding: 30px; color: #10b981; font-weight: 700; }
  `]
})
export class AlertsComponent implements OnInit {
  alerts: OperationalAlert[] = [];
  statusFilter = 'All';
  severityFilter = 'All';

  constructor(
    private alertService: AlertService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertService.getAlerts(this.statusFilter, this.severityFilter).subscribe(res => {
      this.alerts = res.data;
    });
  }

  acknowledge(id: string): void {
    this.alertService.acknowledgeAlert(id).subscribe(() => {
      this.toastService.success('Alert Acknowledged', 'Alert status updated.');
      this.loadAlerts();
    });
  }
}
