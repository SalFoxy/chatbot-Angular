import { Component, signal, ViewChild, ElementRef, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService, ChatMessage, ChatRequest, ChatSession } from './chat.service';
// IMPORTANTE: Importa la sidebar
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MarkdownModule, FormsModule, SidebarComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewInit {

  // Usa inject() invece del costruttore per robustezza
  private chatService = inject(ChatService);

  // Stato
  messages = signal<ChatMessage[]>([]);
  history = signal<ChatSession[]>([]);
  currentSessionId = signal<string>('');
  
  userInput = signal('');
  isLoading = signal(false);
  isSidebarOpen = signal(true); 

  private readonly typingSpeedMs = 15; 

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.loadHistory();
    this.checkMobile();

    // Carica ultima chat o creane una nuova
    if (this.history().length > 0) {
      this.loadChat(this.history()[0]);
    } else {
      this.startNewChat();
    }
    
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  // --- GESTIONE LAYOUT ---
  checkMobile() {
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
    else this.isSidebarOpen.set(true);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  // --- LOGICA CHAT ---

  loadHistory() {
    this.history.set(this.chatService.getHistory());
  }

  startNewChat() {
    const newId = crypto.randomUUID();
    this.currentSessionId.set(newId);
    this.messages.set([
      { sender: 'ai', text: '👋 Ciao! Sono LipariGPT. Come posso aiutarti?' }
    ]);
    
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
    setTimeout(() => this.chatInput?.nativeElement?.focus(), 100);
  }

  loadChat(session: ChatSession) {
    this.currentSessionId.set(session.id);
    this.messages.set(session.messages);
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
    this.scrollToBottom();
  }

  handleDeleteChat(id: string) {
    if (!confirm("Vuoi eliminare questa conversazione?")) return;

    const newHistory = this.chatService.deleteSession(id);
    this.history.set(newHistory);

    if (this.currentSessionId() === id) {
      if (newHistory.length > 0) this.loadChat(newHistory[0]);
      else this.startNewChat();
    }
  }

  // --- INVIO & STREAMING ---

  sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;
    
    // 1. Aggiungi msg utente
    this.messages.update(m => [...m, { sender: 'user', text }]);
    this.userInput.set('');
    this.scrollToBottom();
    this.isLoading.set(true);

    // 2. Chiama API
    const payload: ChatRequest = { message: text, conversationId: this.currentSessionId() };
    this.streamAiResponse(payload);
  }

  async streamAiResponse(payload: ChatRequest) {
    // Placeholder AI
    this.messages.update(m => [...m, { sender: 'ai', text: '' }]);
    const aiIndex = this.messages().length - 1;

    let fullResponseBuffer = '';
    let displayedResponse = '';
    let isStreamComplete = false;

    // Loop scrittura
    const typeWriterLoop = async () => {
      while (!isStreamComplete || displayedResponse.length < fullResponseBuffer.length) {
        if (displayedResponse.length < fullResponseBuffer.length) {
          displayedResponse += fullResponseBuffer[displayedResponse.length];
          this.messages.update(m => {
             const newMsgs = [...m]; 
             newMsgs[aiIndex] = { ...newMsgs[aiIndex], text: displayedResponse }; 
             return newMsgs;
          });
          this.scrollToBottom();
          await new Promise(r => setTimeout(r, this.typingSpeedMs));
        } else {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      this.isLoading.set(false);
      this.saveCurrentSession();
    };

    typeWriterLoop();

    try {
      await this.chatService.streamAnswer(payload, (chunk) => fullResponseBuffer += chunk);
    } catch (e) { 
      fullResponseBuffer += "\n[Errore di connessione]"; 
    } finally { 
      isStreamComplete = true; 
    }
  }

  private saveCurrentSession() {
    const msgs = this.messages();
    if (msgs.length === 0) return;
    
    // Crea titolo dal primo messaggio
    const firstUserMsg = msgs.find(m => m.sender === 'user');
    let title = firstUserMsg ? (firstUserMsg.text.substring(0, 30) + '...') : 'Nuova Chat';
    
    this.chatService.saveSession({
      id: this.currentSessionId(), title, messages: msgs, timestamp: Date.now()
    });
    this.loadHistory();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 50);
  }
}