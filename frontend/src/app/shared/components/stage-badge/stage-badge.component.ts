import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stage-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="stage-badge" [ngClass]="badgeColorClass">
      <svg class="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
      </svg>
      {{ stage }}
    </span>
  `,
  styles: [`
    .stage-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    .stage-icon {
      width: 12px;
      height: 12px;
    }
    .stage-assessment { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.25); }
    .stage-design { background: rgba(168, 85, 247, 0.12); color: #c084fc; border-color: rgba(168, 85, 247, 0.25); }
    .stage-permit { background: rgba(234, 179, 8, 0.12); color: #facc15; border-color: rgba(234, 179, 8, 0.25); }
    .stage-install { background: rgba(16, 185, 129, 0.12); color: #34d399; border-color: rgba(16, 185, 129, 0.25); }
    .stage-complete { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-color: rgba(59, 130, 246, 0.25); }
  `]
})
export class StageBadgeComponent {
  @Input({ required: true }) stage = 'Site Assessment';

  get badgeColorClass(): string {
    if (this.stage.includes('Assessment')) return 'stage-assessment';
    if (this.stage.includes('Design')) return 'stage-design';
    if (this.stage.includes('Permit')) return 'stage-permit';
    if (this.stage.includes('Installation') || this.stage.includes('Scheduling')) return 'stage-install';
    if (this.stage.includes('Completion') || this.stage.includes('Inspection')) return 'stage-complete';
    return '';
  }
}
