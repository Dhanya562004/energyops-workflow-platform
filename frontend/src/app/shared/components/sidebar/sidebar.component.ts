import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container">
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"/>
            <rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/>
            <rect x="3" y="16" width="7" height="5"/>
          </svg>
          <span class="nav-label">Dashboard</span>
        </a>

        <a routerLink="/workflow" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="5" height="18" rx="1"/>
            <rect x="10" y="3" width="5" height="12" rx="1"/>
            <rect x="17" y="3" width="5" height="15" rx="1"/>
          </svg>
          <span class="nav-label">Workflow Board</span>
        </a>

        <a routerLink="/jobs" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span class="nav-label">Jobs Registry</span>
        </a>

        <a routerLink="/alerts" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="nav-label">Alerts & Incidents</span>
        </a>

        <a routerLink="/metrics" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span class="nav-label">System Metrics</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="env-tag">
          <span class="env-dot"></span>
          <span>Prod Ops Environment</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 240px;
      background: var(--bg-surface, #1e293b);
      border-right: 1px solid var(--border-color, #334155);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
      padding: 16px 12px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: var(--text-muted, #94a3b8);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: all 0.2s ease;
      svg { width: 18px; height: 18px; stroke: var(--text-muted, #94a3b8); }
      &:hover {
        background: var(--bg-hover, #334155);
        color: var(--text-main, #f8fafc);
        svg { stroke: var(--text-main, #f8fafc); }
      }
      &.active {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
        color: #38bdf8;
        border-left: 3px solid #38bdf8;
        svg { stroke: #38bdf8; }
      }
    }
    .sidebar-footer {
      padding: 12px;
      background: var(--bg-darker, #0f172a);
      border-radius: 8px;
      border: 1px solid var(--border-color, #334155);
    }
    .env-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }
    .env-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }
  `]
})
export class SidebarComponent {}
