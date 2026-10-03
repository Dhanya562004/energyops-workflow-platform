import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="priority-badge" [ngClass]="badgeClass">
      <span class="priority-bar"></span>
      {{ priority }}
    </span>
  `,
  styles: [`
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .priority-bar {
      width: 3px;
      height: 10px;
      border-radius: 1px;
    }
    .p-critical {
      background: rgba(225, 29, 72, 0.15);
      color: #fb7185;
      .priority-bar { background: #f43f5e; }
    }
    .p-high {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      .priority-bar { background: #f59e0b; }
    }
    .p-medium {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      .priority-bar { background: #3b82f6; }
    }
    .p-low {
      background: rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      .priority-bar { background: #64748b; }
    }
  `]
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority = 'Medium';

  get badgeClass(): string {
    switch (this.priority) {
      case 'Critical': return 'p-critical';
      case 'High': return 'p-high';
      case 'Medium': return 'p-medium';
      case 'Low': return 'p-low';
      default: return 'p-medium';
    }
  }
}
