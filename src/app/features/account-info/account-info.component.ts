import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-info',
  standalone: true,
  templateUrl: './account-info.component.html',
  styleUrl: './account-info.component.css'
})
export class AccountInfoComponent {
  @Input() user: { name?: string } | null = null;
  openMenu = false;

  getInitials(name?: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
  }

  onLogout() {
    this.openMenu = false;
    alert('Logout!');
  }
}