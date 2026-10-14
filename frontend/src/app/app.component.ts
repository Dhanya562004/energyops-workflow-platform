import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    ToastComponent
  ],
  template: `
    <div class="app-layout">
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <app-navbar></app-navbar>
      <div class="app-body">
        <app-sidebar></app-sidebar>
        <main id="main-content" class="main-content" role="main" tabindex="-1">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #0f172a);
      color: var(--text-main, #f8fafc);
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .app-body {
      display: flex;
      flex: 1;
      position: relative;
    }
    .main-content {
      flex: 1;
      padding: var(--space-6, 24px) var(--space-8, 32px);
      overflow-y: auto;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      outline: none;
    }

    /* Responsive Breakpoints: 768px (Tablet) & 375px (Mobile) */
    @media (max-width: 768px) {
      .app-body {
        flex-direction: column;
      }
      .main-content {
        padding: var(--space-4, 16px);
      }
    }
    @media (max-width: 375px) {
      .main-content {
        padding: var(--space-3, 12px) var(--space-2, 8px);
      }
    }
  `]
})
export class AppComponent {
  title = 'EnergyOps – Installation Workflow & Operations Platform';
}
