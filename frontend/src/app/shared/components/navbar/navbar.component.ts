import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AlertService } from '../../../services/alert.service';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-container" role="banner" aria-label="EnergyOps Platform Navigation Bar">
      <div class="navbar-left">
        <a routerLink="/" class="brand-link" aria-label="EnergyOps Home Command Center">
          <div class="brand-logo" aria-hidden="true">⚡</div>
          <div class="brand-text">
            <span class="brand-name">EnergyOps</span>
            <span class="brand-sub">Installation Platform</span>
          </div>
        </a>
        <div class="system-status" title="Backend API Healthy" role="status" aria-label="System status: API v1.4.2 Healthy">
          <span class="status-pulse" aria-hidden="true"></span>
          <span class="status-label">API v1.4.2</span>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Operational Alerts Link -->
        <a 
          routerLink="/alerts" 
          class="alerts-btn" 
          title="Operational Alerts" 
          [attr.aria-label]="'Operational Incidents Desk. ' + ((alertService.activeCount$ | async) || 0) + ' active incidents'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span *ngIf="(alertService.activeCount$ | async) as count" class="alert-count-badge" aria-hidden="true">
            {{ count }}
          </span>
        </a>

        <!-- Theme Switcher -->
        <button 
          type="button"
          class="theme-toggle-btn" 
          (click)="themeService.toggleTheme()" 
          [attr.aria-label]="'Switch to ' + (themeService.currentTheme === 'dark' ? 'Light' : 'Dark') + ' theme'"
        >
          <span *ngIf="themeService.currentTheme === 'dark'" aria-hidden="true">☀️</span>
          <span *ngIf="themeService.currentTheme === 'light'" aria-hidden="true">🌙</span>
        </button>

        <!-- Role Switcher -->
        <div class="role-switcher">
          <label for="role-select" class="role-label">Role:</label>
          <select 
            id="role-select"
            [value]="roleService.currentRole" 
            (change)="onRoleChange($event)"
            class="role-select"
            aria-label="Switch active simulated user role"
          >
            <option value="Admin">Admin (Full Override)</option>
            <option value="Manager">Manager (Approvals)</option>
            <option value="Engineer">Engineer (Field Progress)</option>
          </select>
        </div>

        <!-- User Profile Pill -->
        <div class="user-pill" *ngIf="roleService.activeUser$ | async as user" role="group" [attr.aria-label]="'Logged in user ' + user.name">
          <img [src]="user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'" class="user-avatar" [alt]="user.name + ' avatar'">
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role-badge" [ngClass]="user.role.toLowerCase()">{{ user.role }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-container {
      min-height: 64px;
      background: var(--bg-surface, #1e293b);
      border-bottom: 1px solid var(--border-color, #334155);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6, 24px);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      flex-wrap: wrap;
      gap: 12px;
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      &:focus-visible { outline: 2px solid var(--accent); border-radius: 8px; }
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-main, #f8fafc);
    }
    .brand-sub {
      font-size: 0.7rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 500;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      color: #10b981;
      font-weight: 600;
    }
    .status-pulse {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .alerts-btn {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--bg-hover, #334155);
      color: var(--text-main, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      svg { width: 20px; height: 20px; }
      &:hover { background: #475569; }
      &:focus-visible { outline: 2px solid var(--accent); }
    }
    .alert-count-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #1e293b;
    }

    .theme-toggle-btn {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--bg-hover, #334155);
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { background: #475569; }
      &:focus-visible { outline: 2px solid var(--accent); }
    }

    .role-switcher {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-darker, #0f172a);
      padding: 5px 10px;
      border-radius: 8px;
      border: 1px solid var(--border-color, #334155);
    }
    .role-label {
      font-size: 0.72rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }
    .role-select {
      background: transparent;
      border: none;
      color: #38bdf8;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
      outline: none;
      &:focus-visible { outline: 2px solid var(--accent); }
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #3b82f6;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
    }
    .user-role-badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      &.admin { color: #f43f5e; }
      &.manager { color: #38bdf8; }
      &.engineer { color: #34d399; }
    }

    /* Responsive Queries */
    @media (max-width: 768px) {
      .navbar-container {
        padding: 8px 16px;
      }
      .brand-sub { display: none; }
      .system-status { display: none; }
    }
    @media (max-width: 480px) {
      .user-info { display: none; }
      .role-label { display: none; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  constructor(
    public roleService: RoleService,
    public themeService: ThemeService,
    public alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.alertService.getAlerts().subscribe();
  }

  onRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.roleService.setRole(select.value as UserRole);
  }
}
