import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from './chat.service';
import { MarkdownModule } from 'ngx-markdown';


interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {

  constructor(private chatService: ChatService) {}

  messages = signal<ChatMessage[]>([
    { sender: 'ai', text: '👋 Ciao, sono LipariGPT! Come posso aiutarti?' }
  ]);

  userInput = signal('');

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngAfterViewInit() {
  this.scrollToBottom();
}

private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }



  sendMessage() {
    const text = this.userInput().trim();
    if (!text) return;

    // Messaggio utente
    this.messages.update(m => [...m, { sender: 'user', text }]);
    this.userInput.set('');
    this.scrollToBottom();

    this.streamAiResponse(text);
  }

  async streamAiResponse(userMsg: string) {
  this.messages.update(m => [...m, { sender: 'ai', text: '' }]);
  const aiIndex = this.messages().length - 1;

  let buffer = '';

  await this.chatService.streamAnswer(userMsg, async chunk => {

    for (const char of chunk) {
      buffer += char;

      this.messages.update(m => {
        m[aiIndex].text = buffer;
        return [...m];
      });

      this.scrollToBottom();

      // QUI controlli la velocità dello "scrivere"
      await new Promise(r => setTimeout(r, 12)); 
    }

  });
}
}
