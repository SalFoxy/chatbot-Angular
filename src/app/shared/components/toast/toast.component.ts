import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="toast" 
        [class]="toast.type"
        (click)="toastService.remove(toast.id)">
        <i [class]="'bi ' + toast.icon"></i>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
      backdrop-filter: blur(10px);
    }

    .toast.success i { color: var(--brand-green); }
    .toast.error i { color: #f87171; }
    .toast.info i { color: var(--brand-blue); }

    .toast i {
      font-size: 18px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      to {
        opacity: 0;
        transform: translateX(50%);
      }
    }

    @media (max-width: 768px) {
      .toast-container {
        left: 16px;
        right: 16px;
        bottom: 80px;
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}