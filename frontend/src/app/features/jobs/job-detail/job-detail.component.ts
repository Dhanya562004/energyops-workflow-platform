import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { Job, WORKFLOW_STAGES, WorkflowStage, WorkflowStatus } from '../../../models/job.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    StageBadgeComponent,
    PriorityBadgeComponent
  ],
  template: `
    <div class="job-detail-page" *ngIf="job">
      <!-- Top Breadcrumb & Actions Header -->
      <div class="detail-header">
        <div class="header-left">
          <a routerLink="/jobs" class="back-link">← Back to Jobs Registry</a>
          <div class="title-row">
            <h1 class="job-id-title">{{ job.id }}</h1>
            <app-status-badge [status]="job.status"></app-status-badge>
            <app-stage-badge [stage]="job.currentStage"></app-stage-badge>
            <app-priority-badge [priority]="job.priority"></app-priority-badge>
          </div>
          <p class="customer-subtitle">{{ job.customerName }} • {{ job.siteAddress }}</p>
        </div>

        <div class="header-actions">
          <button *ngIf="job.status !== 'Blocked'" class="btn btn-warning" (click)="openBlockerModal()">
            ⚠️ Flag Blocker
          </button>

          <button *ngIf="job.status === 'Blocked'" class="btn btn-success" (click)="openResolveBlockerModal()">
            ✓ Resolve Blocker
          </button>

          <button class="btn btn-secondary" (click)="openEditModal()">
            ✏️ Edit Job
          </button>

          <button class="btn btn-primary" (click)="openStageModal()">
            ⚡ Advance Stage
          </button>
        </div>
      </div>

      <!-- Active Blocker Banner -->
      <div *ngIf="job.status === 'Blocked'" class="active-blocker-banner">
        <div class="banner-icon">🚨</div>
        <div class="banner-text">
          <div class="banner-title">Job Execution Currently Blocked</div>
          <div class="banner-reason">{{ job.blockerReason }}</div>
        </div>
        <button class="btn btn-light-sm" (click)="openResolveBlockerModal()">Resolve Blocker</button>
      </div>

      <!-- Workflow Stage Stepper -->
      <div class="stepper-card card">
        <h3 class="card-section-title">Workflow Lifecycle Stepper</h3>
        <div class="stepper-container">
          <div 
            *ngFor="let stage of allStages; let idx = index" 
            class="step-item"
            [ngClass]="{
              'step-complete': getStageIndex(job.currentStage) > idx,
              'step-active': job.currentStage === stage,
              'step-future': getStageIndex(job.currentStage) < idx
            }"
          >
            <div class="step-circle">
              <span *ngIf="getStageIndex(job.currentStage) > idx">✓</span>
              <span *ngIf="getStageIndex(job.currentStage) <= idx">{{ idx + 1 }}</span>
            </div>
            <div class="step-label">{{ stage }}</div>
            <div *ngIf="idx < allStages.length - 1" class="step-line"></div>
          </div>
        </div>
      </div>

      <!-- Grid Layout: Overview + Tabs -->
      <div class="detail-grid">
        <!-- Left Column: Overview Details -->
        <div class="grid-left">
          <div class="card overview-card">
            <h3 class="card-section-title">Installation Specs & Attributes</h3>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Product System</span>
                <span class="info-value highlight">{{ job.productType }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Permit Status</span>
                <span class="info-value" [ngClass]="getPermitClass(job.permitStatus)">{{ job.permitStatus }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Target Completion</span>
                <span class="info-value">{{ job.targetCompletionDate | date:'mediumDate' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Assigned Engineer</span>
                <span class="info-value">{{ job.assignedEngineer }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Assigned Manager</span>
                <span class="info-value">{{ job.assignedManager }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Created Timestamp</span>
                <span class="info-value">{{ job.createdAt | date:'medium' }}</span>
              </div>
            </div>

            <!-- Hours Budget Progress -->
            <div class="hours-section">
              <div class="hours-header">
                <span>Labor Hours Budget</span>
                <span class="hours-ratio">
                  <strong>{{ job.actualHours }}h</strong> / {{ job.estimatedHours }}h estimated
                </span>
              </div>
              <div class="hours-progress-track">
                <div 
                  class="hours-progress-fill" 
                  [style.width.%]="Math.min((job.actualHours / job.estimatedHours) * 100, 100)"
                  [ngClass]="{ 'overbudget': job.actualHours > job.estimatedHours }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Tabs (Activity Log, Blockers, Notes) -->
        <div class="grid-right">
          <div class="card tabs-card">
            <div class="tabs-header">
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'history'"
                (click)="activeTab = 'history'"
              >
                📜 Audit Log History ({{ job.history?.length || 0 }})
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'blockers'"
                (click)="activeTab = 'blockers'"
              >
                🚨 Blockers ({{ job.blockers?.length || 0 }})
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'notes'"
                (click)="activeTab = 'notes'"
              >
                💬 Field Notes ({{ job.notes?.length || 0 }})
              </button>
            </div>

            <div class="tab-content">
              <!-- History Tab -->
              <div *ngIf="activeTab === 'history'" class="history-list">
                <div *ngFor="let item of job.history" class="history-item">
                  <div class="history-icon">⚡</div>
                  <div class="history-details">
                    <div class="history-title">
                      Moved to <strong>{{ item.newStage }}</strong> (Status: {{ item.newStatus }})
                    </div>
                    <div class="history-meta">
                      By <strong>{{ item.changedBy }}</strong> • {{ item.createdAt | date:'short' }}
                    </div>
                    <div *ngIf="item.changeReason" class="history-reason">
                      "{{ item.changeReason }}"
                    </div>
                  </div>
                </div>
              </div>

              <!-- Blockers Tab -->
              <div *ngIf="activeTab === 'blockers'" class="blockers-list">
                <div *ngFor="let blk of job.blockers" class="blocker-card" [ngClass]="blk.status.toLowerCase()">
                  <div class="blocker-header">
                    <span class="blocker-status-badge" [ngClass]="blk.status.toLowerCase()">{{ blk.status }}</span>
                    <span class="blocker-date">{{ blk.createdAt | date:'short' }}</span>
                  </div>
                  <div class="blocker-reason-text">{{ blk.reason }}</div>
                  <div class="blocker-by">Flagged by: {{ blk.createdBy }}</div>
                  <div *ngIf="blk.resolutionNotes" class="blocker-resolution">
                    <strong>Resolution Note:</strong> {{ blk.resolutionNotes }} (by {{ blk.resolvedBy }})
                  </div>
                </div>

                <div *ngIf="!job.blockers || job.blockers.length === 0" class="empty-tab">
                  No blockers recorded for this job.
                </div>
              </div>

              <!-- Notes Tab -->
              <div *ngIf="activeTab === 'notes'" class="notes-container">
                <div class="add-note-box">
                  <textarea 
                    [(ngModel)]="newNoteContent" 
                    placeholder="Add an operational update or engineering note..."
                    rows="3"
                    class="note-textarea"
                  ></textarea>
                  <button class="btn btn-primary btn-sm" (click)="addNote()">Post Note</button>
                </div>

                <div class="notes-list">
                  <div *ngFor="let note of job.notes" class="note-card">
                    <div class="note-header">
                      <span class="note-author">{{ note.author }} ({{ note.role }})</span>
                      <span class="note-time">{{ note.createdAt | date:'short' }}</span>
                    </div>
                    <div class="note-body">{{ note.content }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <!-- Flag Blocker Modal -->
      <div class="modal-backdrop" *ngIf="showBlockerModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Flag Operational Blocker</h3>
            <button class="modal-close" (click)="showBlockerModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p>Describe the issue causing this job to be blocked:</p>
            <textarea 
              [(ngModel)]="blockerInput" 
              rows="4" 
              placeholder="e.g. Utility interconnect permit rejected due to grid capacity limitation..."
              class="modal-input"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showBlockerModal = false">Cancel</button>
            <button class="btn btn-warning" (click)="submitBlocker()">Flag Blocker</button>
          </div>
        </div>
      </div>

      <!-- Resolve Blocker Modal -->
      <div class="modal-backdrop" *ngIf="showResolveModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Resolve Active Blocker</h3>
            <button class="modal-close" (click)="showResolveModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p>Provide resolution summary notes:</p>
            <textarea 
              [(ngModel)]="resolutionInput" 
              rows="4" 
              placeholder="e.g. Revised transformer specs approved by regional engineer..."
              class="modal-input"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showResolveModal = false">Cancel</button>
            <button class="btn btn-success" (click)="submitResolveBlocker()">Resolve & Resume Job</button>
          </div>
        </div>
      </div>

      <!-- Stage Advance Modal -->
      <div class="modal-backdrop" *ngIf="showStageModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Advance Stage Transition</h3>
            <button class="modal-close" (click)="showStageModal = false">✕</button>
          </div>
          <div class="modal-body">
            <label>Select Target Stage:</label>
            <select [(ngModel)]="selectedTargetStage" class="modal-select">
              <option *ngFor="let st of allStages" [value]="st">{{ st }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showStageModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitStageChange()">Confirm Stage</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .job-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .back-link {
      font-size: 0.8rem;
      color: #38bdf8;
      text-decoration: none;
      font-weight: 700;
      margin-bottom: 6px;
      display: inline-block;
      &:hover { text-decoration: underline; }
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .job-id-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
    }
    .customer-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted, #94a3b8);
      margin-top: 4px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }

    .active-blocker-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      color: #f87171;
    }
    .banner-icon { font-size: 1.8rem; }
    .banner-text { flex: 1; }
    .banner-title { font-weight: 800; font-size: 1rem; }
    .banner-reason { font-size: 0.85rem; margin-top: 2px; }

    .stepper-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      padding: 20px;
    }
    .card-section-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
      margin-bottom: 16px;
    }
    .stepper-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      z-index: 1;
    }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-darker, #0f172a);
      border: 2px solid var(--border-color, #334155);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--text-muted, #94a3b8);
    }
    .step-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
      margin-top: 6px;
      text-align: center;
    }
    .step-item.step-complete {
      .step-circle { background: #10b981; border-color: #10b981; color: #fff; }
      .step-label { color: #10b981; }
    }
    .step-item.step-active {
      .step-circle { background: #3b82f6; border-color: #3b82f6; color: #fff; box-shadow: 0 0 12px #3b82f6; }
      .step-label { color: #3b82f6; font-weight: 800; }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .overview-card, .tabs-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      padding: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }
    .info-value {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
      margin-top: 2px;
      &.highlight { color: #38bdf8; }
    }

    .hours-section {
      background: var(--bg-darker, #0f172a);
      padding: 14px;
      border-radius: 8px;
    }
    .hours-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: var(--text-muted, #94a3b8);
      margin-bottom: 8px;
    }
    .hours-progress-track {
      height: 8px;
      background: var(--bg-surface, #1e293b);
      border-radius: 9999px;
      overflow: hidden;
    }
    .hours-progress-fill {
      height: 100%;
      background: #10b981;
      &.overbudget { background: #ef4444; }
    }

    .tabs-header {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid var(--border-color, #334155);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #94a3b8);
      font-size: 0.82rem;
      font-weight: 700;
      padding: 6px 10px;
      cursor: pointer;
      &.active {
        color: #38bdf8;
        border-bottom: 2px solid #38bdf8;
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .history-item {
      display: flex;
      gap: 12px;
      background: var(--bg-darker, #0f172a);
      padding: 12px;
      border-radius: 8px;
    }
    .history-icon {
      font-size: 1.2rem;
    }
    .history-title {
      font-size: 0.85rem;
      color: var(--text-main, #f8fafc);
    }
    .history-meta {
      font-size: 0.72rem;
      color: var(--text-muted, #94a3b8);
      margin-top: 2px;
    }
    .history-reason {
      font-size: 0.78rem;
      color: #94a3b8;
      font-style: italic;
      margin-top: 4px;
    }

    .notes-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .note-textarea {
      width: 100%;
      padding: 10px;
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      color: #fff;
      font-size: 0.85rem;
      margin-bottom: 8px;
    }
    .note-card {
      background: var(--bg-darker, #0f172a);
      padding: 12px;
      border-radius: 8px;
      margin-top: 8px;
    }
    .note-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
      margin-bottom: 6px;
    }
    .note-author { font-weight: 700; color: #38bdf8; }
    .note-body { font-size: 0.85rem; color: var(--text-main, #f8fafc); }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.75);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px; width: 100%; max-width: 480px; padding: 20px;
    }
    .modal-header { display: flex; justify-content: space-between; margin-bottom: 16px; h3 { color: #fff; } }
    .modal-close { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
    .modal-input, .modal-select { width: 100%; padding: 10px; background: var(--bg-darker, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 8px; color: #fff; margin-top: 8px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `]
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  allStages = WORKFLOW_STAGES;
  activeTab = 'history';
  Math = Math;

  showBlockerModal = false;
  blockerInput = '';

  showResolveModal = false;
  resolutionInput = '';

  showStageModal = false;
  selectedTargetStage: WorkflowStage = 'Site Assessment';

  showEditModal = false;

  newNoteContent = '';

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    public roleService: RoleService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadJobDetail(id);
    }
  }

  loadJobDetail(id: string): void {
    this.jobService.getJobById(id).subscribe(res => {
      this.job = res.data;
      if (this.job) {
        this.selectedTargetStage = this.job.currentStage;
      }
    });
  }

  getStageIndex(stage: string): number {
    return WORKFLOW_STAGES.indexOf(stage as any);
  }

  getPermitClass(status: string): string {
    if (status === 'Approved') return 'text-emerald-400';
    if (status === 'Revision Required' || status === 'Rejected') return 'text-rose-400';
    return 'text-amber-400';
  }

  openBlockerModal(): void {
    this.blockerInput = '';
    this.showBlockerModal = true;
  }

  submitBlocker(): void {
    if (!this.job || !this.blockerInput.trim()) return;

    this.jobService.addBlocker(this.job.id, this.blockerInput).subscribe(() => {
      this.toastService.warning('Blocker Flagged', `Job ${this.job?.id} marked as Blocked.`);
      this.showBlockerModal = false;
      this.loadJobDetail(this.job!.id);
    });
  }

  openResolveBlockerModal(): void {
    this.resolutionInput = '';
    this.showResolveModal = true;
  }

  submitResolveBlocker(): void {
    if (!this.job || !this.job.blockers || this.job.blockers.length === 0) return;

    const activeBlk = this.job.blockers.find(b => b.status === 'Active');
    if (!activeBlk) return;

    this.jobService.resolveBlocker(activeBlk.id, this.resolutionInput).subscribe(() => {
      this.toastService.success('Blocker Resolved', `Job ${this.job?.id} unblocked and resumed.`);
      this.showResolveModal = false;
      this.loadJobDetail(this.job!.id);
    });
  }

  openStageModal(): void {
    this.showStageModal = true;
  }

  submitStageChange(): void {
    if (!this.job) return;

    const isOverride = this.roleService.canOverrideStage();

    this.jobService.updateStage(this.job.id, this.selectedTargetStage, isOverride).subscribe({
      next: () => {
        this.toastService.success('Stage Updated', `Job moved to ${this.selectedTargetStage}.`);
        this.showStageModal = false;
        this.loadJobDetail(this.job!.id);
      },
      error: (err) => {
        const msg = err.error?.error?.message || 'Invalid stage transition';
        this.toastService.error('Transition Rejected', msg);
      }
    });
  }

  openEditModal(): void {
    this.toastService.info('Edit Mode', 'Edit job form activated.');
  }

  addNote(): void {
    if (!this.job || !this.newNoteContent.trim()) return;

    this.jobService.addNote(this.job.id, this.newNoteContent).subscribe(() => {
      this.toastService.success('Note Added', 'Field note saved.');
      this.newNoteContent = '';
      this.loadJobDetail(this.job!.id);
    });
  }
}
