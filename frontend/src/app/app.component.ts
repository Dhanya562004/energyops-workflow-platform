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
      <app-navbar></app-navbar>
      <div class="app-body">
        <app-sidebar></app-sidebar>
        <main class="main-content">
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
    }
    .main-content {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
      max-width: 1600px;
    }
  `]
})
export class AppComponent {
  title = 'EnergyOps – Installation Workflow & Operations Platform';
}
