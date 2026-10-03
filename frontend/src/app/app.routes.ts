import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'workflow',
    loadComponent: () => import('./features/workflow/workflow.component').then(m => m.WorkflowComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./features/jobs/jobs-list/jobs-list.component').then(m => m.JobsListComponent)
  },
  {
    path: 'jobs/:id',
    loadComponent: () => import('./features/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },
  {
    path: 'alerts',
    loadComponent: () => import('./features/alerts/alerts.component').then(m => m.AlertsComponent)
  },
  {
    path: 'metrics',
    loadComponent: () => import('./features/metrics/metrics.component').then(m => m.MetricsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
