import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
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
  @Input() history: ChatSession[] = [];
  @Input() currentSessionId: string = '';
  @Input() isOpen: boolean = true;

  @Output() onSelect = new EventEmitter<ChatSession>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onRename = new EventEmitter<{ id: string; newTitle: string }>();
  @Output() onNewChat = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  openMenuId: string | null = null;
  editingSessionId: string | null = null;

  @ViewChild('renameInput') renameInput! : ElementRef<HTMLInputElement>;

  selectChat(session: ChatSession) {
    if (! this.editingSessionId) {
      this.onSelect. emit(session);
    }
  }

  toggleMenu(event: Event, sessionId: string) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === sessionId ? null : sessionId;
  }

  closeMenu() {
    this.openMenuId = null;
  }

  startRename(event: Event, session: ChatSession) {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this. openMenuId = null;
    
    setTimeout(() => {
      this.renameInput?. nativeElement?. focus();
      this.renameInput?. nativeElement?.select();
    }, 0);
  }

  confirmRename(session: ChatSession, event: Event) {
    const input = event.target as HTMLInputElement;
    const newTitle = input.value. trim();
    
    if (newTitle && newTitle !== session.title) {
      this.onRename.emit({ id: session.id, newTitle });
    }
    this.editingSessionId = null;
  }

  cancelRename() {
    this.editingSessionId = null;
  }

  deleteChat(event: Event, sessionId: string) {
    event.stopPropagation();
    this.openMenuId = null;
    this.onDelete.emit(sessionId);
  }
}