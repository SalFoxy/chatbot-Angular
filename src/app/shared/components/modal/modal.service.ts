import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  isOpen = signal(false);
  config = signal<ModalConfig | null>(null);
  
  private resolvePromise: ((value: boolean) => void) | null = null;

  confirm(config: ModalConfig): Promise<boolean> {
    this.config. set({
      icon: 'bi-exclamation-triangle-fill',
      confirmText: 'Conferma',
      cancelText: 'Annulla',
      type: 'danger',
      ...config
    });
    this.isOpen.set(true);

    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  close(result: boolean) {
    this.isOpen.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}