import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PolizzaData {
  tipo?: string;
  numero?: string;
  intestatario?: string;
  veicolo?: string;
  scadenza?: string;
  premio?: string;
  coperture?: string[];
  stato?: string;
}

@Component({
  selector: 'app-polizza-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="polizza-card">
      <div class="polizza-header">
        <div class="polizza-icon">
          <i class="bi bi-shield-check"></i>
        </div>
        <div class="polizza-title">
          <span class="polizza-type">{{ data.tipo || 'Polizza' }}</span>
          <span class="polizza-number">{{ data.numero }}</span>
        </div>
        <span class="polizza-status" [class]="getStatusClass()">
          {{ data.stato || 'attiva' }}
        </span>
      </div>

      <div class="polizza-body">
        <div class="polizza-row" *ngIf="data.intestatario">
          <i class="bi bi-person"></i>
          <span class="label">Intestatario</span>
          <span class="value">{{ data.intestatario }}</span>
        </div>

        <div class="polizza-row" *ngIf="data.veicolo">
          <i class="bi bi-car-front"></i>
          <span class="label">Veicolo</span>
          <span class="value">{{ data.veicolo }}</span>
        </div>

        <div class="polizza-row" *ngIf="data.scadenza">
          <i class="bi bi-calendar"></i>
          <span class="label">Scadenza</span>
          <span class="value">{{ data.scadenza }}</span>
        </div>

        <div class="polizza-row" *ngIf="data.premio">
          <i class="bi bi-currency-euro"></i>
          <span class="label">Premio</span>
          <span class="value premio">{{ data.premio }}</span>
        </div>
      </div>

      <div class="polizza-footer" *ngIf="data.coperture && data.coperture.length">
        <div class="coperture-label">Coperture incluse</div>
        <div class="coperture-list">
          <span class="copertura" *ngFor="let cop of data.coperture">
            <i class="bi bi-check-circle-fill"></i>
            {{ cop }}
          </span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './polizza-card.component.css'
})
export class PolizzaCardComponent {
  @Input() data: PolizzaData = {};

  getStatusClass(): string {
    const stato = (this.data.stato || '').toLowerCase();
    if (stato.includes('attiva')) return 'status-active';
    if (stato.includes('scaduta')) return 'status-expired';
    if (stato.includes('rinnovo')) return 'status-renewal';
    return 'status-active';
  }
}