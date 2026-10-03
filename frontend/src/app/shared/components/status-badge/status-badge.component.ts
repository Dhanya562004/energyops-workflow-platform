import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowStatus } from '../../../models/job.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      <span class="status-dot"></span>
      {{ status }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.025em;
      white-space: nowrap;
      text-transform: uppercase;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .badge-in-progress {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      .status-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
    }
    .badge-blocked {
      background: rgba(239, 68, 68, 0.18);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
      animation: pulseAlert 2s infinite;
      .status-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
    }
    .badge-completed {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      .status-dot { background: #3b82f6; }
    }
    .badge-delayed {
      background: rgba(245, 158, 11, 0.18);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.35);
      .status-dot { background: #f59e0b; }
    }
    .badge-not-started {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.3);
      .status-dot { background: #94a3b8; }
    }

    @keyframes pulseAlert {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: WorkflowStatus | string = 'Not Started';

  get badgeClass(): string {
    switch (this.status) {
      case 'In Progress': return 'badge-in-progress';
      case 'Blocked': return 'badge-blocked';
      case 'Completed': return 'badge-completed';
      case 'Delayed': return 'badge-delayed';
      default: return 'badge-not-started';
    }
  }
}
