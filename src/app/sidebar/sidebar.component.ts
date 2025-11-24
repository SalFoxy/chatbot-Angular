import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSession } from '../chat/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // --- INPUT: Dati ricevuti dal padre ---
  @Input() history: ChatSession[] = [];
  @Input() currentSessionId: string = '';
  @Input() isOpen: boolean = true;

  // --- OUTPUT: Eventi inviati al padre ---
  @Output() onSelect = new EventEmitter<ChatSession>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onNewChat = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  selectChat(session: ChatSession) {
    this.onSelect.emit(session);
  }

  deleteChat(event: Event, id: string) {
    event.stopPropagation();
    this.onDelete.emit(id);
  }
}