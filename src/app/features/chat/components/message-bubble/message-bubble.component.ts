import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { ChatMessage } from '../../models/chat.models';
import { CollapsibleSectionsDirective } from '../../../../shared/directives/collapsible-sections.directive';
import { MessageParserDirective } from '../../../../shared/directives/message-parser.directive';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, MarkdownModule, CollapsibleSectionsDirective, MessageParserDirective],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.css'
})
export class MessageBubbleComponent {
  @Input() message! : ChatMessage;
  @Input() index! : number;
  @Input() isLoading = false;
  @Input() isCopied = false;
  @Input() totalMessages = 0;

  @Output() onCopy = new EventEmitter<string>();

  // --- CARD HELPERS ---
  hasSpecialCard(text: string): boolean {
    return /:::polizza/i.test(text);
  }

  getDisplayText(text: string): string {
    const incompleteBlockRegex = /:::polizza(?:(?! :::).)*$/is;
    return text.replace(incompleteBlockRegex, '');
  }

  isMessageComplete(): boolean {
    return ! this.isLoading || this.index !== this.totalMessages - 1;
  }

  shouldShowCard(text: string): boolean {
    return /:::polizza[\s\S]*? :::/i.test(text);
  }

  shouldUseParser(): boolean {
    return this.isMessageComplete() && this.shouldShowCard(this.message.text);
  }

  getVisibleText(): string {
    if (this.isMessageComplete()) {
      return this.message.text;
    }
    return this.getDisplayText(this.message.text);
  }

  copyMessage() {
    this.onCopy.emit(this.message.text);
  }
}