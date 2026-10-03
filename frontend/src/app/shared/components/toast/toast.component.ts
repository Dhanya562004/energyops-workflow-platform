import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      <div 
        *ngFor="let toast of toastService.toasts$ | async" 
        class="toast-card" 
        [ngClass]="toast.type"
      >
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.dismiss(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }
    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 10px;
      background: #1e293b;
      color: #f8fafc;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      border-left: 5px solid #3b82f6;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-card.success { border-left-color: #10b981; }
    .toast-card.error { border-left-color: #ef4444; }
    .toast-card.warning { border-left-color: #f59e0b; }
    .toast-card.info { border-left-color: #3b82f6; }

    .toast-title {
      font-weight: 700;
      font-size: 0.88rem;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 1rem;
      padding: 0 4px;
      &:hover { color: #f8fafc; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
