import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  modalService = inject(ModalService);

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.modalService.isOpen()) {
      this.modalService.close(false);
    }
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modalService.close(false);
    }
  }

  getConfirmIcon(): string {
    const type = this.modalService.config()?.type;
    switch (type) {
      case 'danger': return 'bi-trash';
      case 'warning': return 'bi-exclamation-triangle';
      default: return 'bi-check-lg';
    }
  }
}