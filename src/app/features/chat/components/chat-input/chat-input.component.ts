import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.css'
})
export class ChatInputComponent {
  @Input() isLoading = false;
  @Output() onSend = new EventEmitter<string>();

  @ViewChild('chatInput') chatInput!: ElementRef<HTMLTextAreaElement>;

  userInput = '';

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (! text || this.isLoading) return;
    
    this.onSend.emit(text);
    this.userInput = '';
    this.resetTextareaHeight();
  }

  resetTextareaHeight() {
    const textarea = this.chatInput?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  focus() {
    setTimeout(() => {
      this.chatInput?.nativeElement?.focus();
      this.resetTextareaHeight();
    }, 100);
  }
}