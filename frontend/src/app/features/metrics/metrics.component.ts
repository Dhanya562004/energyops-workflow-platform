import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MetricsService } from '../../services/metrics.service';
import { ToastService } from '../../core/services/toast.service';
import { SystemMetrics } from '../../models/metrics.model';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Production Observability & System Metrics</h1>
          <p class="page-subtitle">Real-time API telemetry, request throughput, backend latency, and client error metrics.</p>
        </div>
        <button class="btn btn-secondary" (click)="refreshMetrics()">
          🔄 Refresh Telemetry
        </button>
      </div>

      <!-- Telemetry Cards Grid -->
      <div class="metrics-grid" *ngIf="metrics">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">API Throughput</span>
            <span class="metric-icon">🚀</span>
          </div>
          <div class="metric-value">{{ metrics.totalRequests | number }}</div>
          <div class="metric-sub">Total HTTP requests handled</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Success Rate</span>
            <span class="metric-icon">✅</span>
          </div>
          <div class="metric-value" [ngClass]="{ 'text-emerald': metrics.successRate >= 95 }">
            {{ metrics.successRate }}%
          </div>
          <div class="metric-sub">{{ metrics.failedRequests }} failed requests</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Avg API Latency</span>
            <span class="metric-icon">⚡</span>
          </div>
          <div class="metric-value">{{ metrics.avgLatencyMs }} ms</div>
          <div class="metric-sub">Max peak: {{ metrics.maxLatencyMs }} ms</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Frontend Error Counter</span>
            <span class="metric-icon">🐞</span>
          </div>
          <div class="metric-value">{{ metrics.frontendErrorCount }}</div>
          <div class="metric-sub">Client HTTP interceptor logs</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Platform Version</span>
            <span class="metric-icon">📦</span>
          </div>
          <div class="metric-value version-text">{{ metrics.version }}</div>
          <div class="metric-sub">SQLite + Express + Angular 18</div>
        </div>
      </div>

      <!-- Interactive Telemetry Simulation Tools -->
      <div class="simulation-panel card">
        <h3 class="panel-title">Telemetry Simulation Controls</h3>
        <p class="panel-sub">Trigger simulated operational events to test metrics aggregation and alert dispatching live.</p>
        <div class="simulation-btns">
          <button class="btn btn-primary" (click)="triggerTestCall()">
            ⚡ Ping API Endpoint
          </button>
          <button class="btn btn-warning" (click)="triggerClientError()">
            ⚠️ Trigger Client Error
          </button>
          <button class="btn btn-secondary" (click)="resetDatabase()">
            🔄 Re-Seed Database (28 Jobs)
          </button>
        </div>
      </div>

      <!-- Endpoint Performance Table -->
      <div class="card table-card" *ngIf="metrics?.endpointMetrics">
        <h3 class="panel-title" style="padding: 16px 20px 0;">API Endpoint Performance Breakdown</h3>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>REST Endpoint</th>
              <th>Request Count</th>
              <th>Avg Response Time</th>
              <th>Error Count</th>
              <th>Health Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ep of metrics?.endpointMetrics">
              <td class="endpoint-code">{{ ep.endpoint }}</td>
              <td><strong>{{ ep.count }}</strong></td>
              <td>{{ ep.avgLatency | number:'1.0-1' }} ms</td>
              <td>
                <span [ngClass]="{ 'error-text': ep.errors > 0 }">{{ ep.errors }}</span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="ep.errors === 0 ? 'healthy' : 'degraded'">
                  {{ ep.errors === 0 ? 'Healthy' : 'Errors Logged' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .metrics-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main, #f8fafc); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .metric-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      padding: 18px;
    }
    .metric-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .metric-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted, #94a3b8); text-transform: uppercase; }
    .metric-icon { font-size: 1.2rem; }
    .metric-value { font-size: 1.8rem; font-weight: 800; color: var(--text-main, #f8fafc); & .version-text { font-size: 1.3rem; color: #38bdf8; } }
    .metric-sub { font-size: 0.72rem; color: var(--text-muted, #94a3b8); margin-top: 4px; }
    .text-emerald { color: #10b981; }

    .simulation-panel {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      padding: 20px;
      border-radius: 12px;
    }
    .panel-title { font-size: 1.05rem; font-weight: 800; color: var(--text-main, #f8fafc); margin-bottom: 4px; }
    .panel-sub { font-size: 0.82rem; color: var(--text-muted, #94a3b8); margin-bottom: 16px; }
    .simulation-btns { display: flex; gap: 12px; }

    .table-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      overflow: hidden;
    }
    .metrics-table {
      width: 100%; border-collapse: collapse; text-align: left; margin-top: 12px;
      th { background: var(--bg-darker, #0f172a); padding: 12px 18px; font-size: 0.75rem; color: var(--text-muted, #94a3b8); }
      td { padding: 14px 18px; border-bottom: 1px solid var(--border-color, #334155); font-size: 0.85rem; }
    }
    .endpoint-code { font-family: monospace; color: #38bdf8; font-weight: 700; }
    .error-text { color: #ef4444; font-weight: 800; }
    .status-badge {
      font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 9999px;
      &.healthy { background: rgba(16, 185, 129, 0.15); color: #10b981; }
      &.degraded { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    }
  `]
})
export class MetricsComponent implements OnInit {
  metrics: SystemMetrics | null = null;

  constructor(
    private metricsService: MetricsService,
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.refreshMetrics();
  }

  refreshMetrics(): void {
    this.metricsService.getMetrics().subscribe(res => {
      this.metrics = res.data;
    });
  }

  triggerTestCall(): void {
    this.http.get('http://localhost:3000/api/jobs/JOB-1001').subscribe(() => {
      this.toastService.info('API Call Executed', 'GET /api/jobs/JOB-1001 logged to metrics.');
      this.refreshMetrics();
    });
  }

  triggerClientError(): void {
    this.metricsService.reportFrontendError({ test: 'Manual user trigger' }).subscribe(() => {
      this.toastService.warning('Simulated Error', 'Frontend error counter incremented.');
      this.refreshMetrics();
    });
  }

  resetDatabase(): void {
    this.http.post('http://localhost:3000/api/seed/reset', {}).subscribe(() => {
      this.toastService.success('Database Re-Seeded', '28 installation jobs re-initialized in SQLite.');
      this.refreshMetrics();
    });
  }
}
