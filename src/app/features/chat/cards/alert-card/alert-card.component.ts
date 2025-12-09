import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AlertData {
  tipo?: 'warning' | 'danger' | 'info' | 'success';
  titolo?: string;
  messaggio?: string;
  azione?: string;
}

@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-card.component.html',
  styleUrl: './alert-card.component.css'
})
export class AlertCardComponent {
  @Input() data: AlertData = {};
  @Output() onAction = new EventEmitter<void>();

  getIcon(): string {
    switch (this.data.tipo) {
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'danger': return 'bi-x-circle-fill';
      case 'success': return 'bi-check-circle-fill';
      case 'info':
      default: return 'bi-info-circle-fill';
    }
  }

  handleAction() {
    this.onAction.emit();
  }
}