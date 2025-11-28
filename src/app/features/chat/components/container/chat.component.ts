import { Component, signal, ViewChild, ElementRef, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Models
import { ChatMessage, ChatRequest, ChatSession } from '../../models/chat.models';

// Services
import { ChatService } from '../../services/chat.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ModalService } from '../../../../shared/components/modal/modal.service';

// Components
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ToastComponent,
    ModalComponent,
    MessageBubbleComponent,
    ChatInputComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewInit {

  // Services
  private chatService = inject(ChatService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  // State
  messages = signal<ChatMessage[]>([]);
  history = signal<ChatSession[]>([]);
  currentSessionId = signal<string>('');
  isLoading = signal(false);
  isSidebarOpen = signal(true);
  showScrollButton = false;
  copiedIndex: number | null = null;

  private readonly typingSpeedMs = 15;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('chatInputComponent') chatInputComponent!: ChatInputComponent;

  // Expose theme service
  get isDarkMode() { return this.themeService.isDarkMode; }

  ngOnInit() {
    this.loadHistory();
    this.checkMobile();

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

  // --- THEME ---
  toggleTheme() {
    this.themeService.toggleTheme();
    this.toastService.show(
      this.isDarkMode() ? 'Tema scuro attivato' : 'Tema chiaro attivato',
      'info'
    );
  }

  // --- LAYOUT ---
  checkMobile() {
    this.isSidebarOpen.set(window.innerWidth >= 768);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  // --- SCROLL ---
  onScroll() {
    const el = this.scrollContainer?.nativeElement;
    if (! el) return;
    
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.showScrollButton = distanceFromBottom > 200;
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      this.showScrollButton = false;
    }, 50);
  }

  // --- COPY ---
  handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      const index = this.messages().findIndex(m => m.text === text);
      this.copiedIndex = index;
      this.toastService.show('Copiato negli appunti!', 'success');
      setTimeout(() => this.copiedIndex = null, 2000);
    });
  }

  // --- CHAT SESSIONS ---
  loadHistory() {
    this.history.set(this.chatService.getHistory());
  }

  startNewChat() {
    const newId = crypto.randomUUID();
    this.currentSessionId.set(newId);
    this.messages.set([
      { sender: 'ai', text: '👋 Ciao! Sono LipariGPT.Come posso aiutarti?' }
    ]);
    
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
    this.chatInputComponent?.focus();
  }

  loadChat(session: ChatSession) {
    this.currentSessionId.set(session.id);
    this.messages.set(session.messages);
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
    this.scrollToBottom();
  }

  async handleDeleteChat(id: string) {
    const confirmed = await this.modalService.confirm({
      title: 'Elimina chat',
      message: 'Vuoi eliminare questa conversazione?  Questa azione non può essere annullata.',
      icon: 'bi-trash',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      type: 'danger'
    });

    if (! confirmed) return;

    const newHistory = this.chatService.deleteSession(id);
    this.history.set(newHistory);
    this.toastService.show('Chat eliminata', 'info');

    if (this.currentSessionId() === id) {
      if (newHistory.length > 0) this.loadChat(newHistory[0]);
      else this.startNewChat();
    }
  }

  handleRenameChat(event: { id: string; newTitle: string }) {
    const session = this.history().find(h => h.id === event.id);
    if (session) {
      session.title = event.newTitle;
      this.chatService.saveSession(session);
      this.history.set([...this.history()]);
    }
  }

  // --- MESSAGING ---
  handleSendMessage(text: string) {
    if (this.isLoading()) return;
    
    this.messages.update(m => [...m, { sender: 'user', text }]);
    this.scrollToBottom();
    this.isLoading.set(true);

    const payload: ChatRequest = { message: text, conversationId: this.currentSessionId() };
    this.streamAiResponse(payload);
  }

  async streamAiResponse(payload: ChatRequest) {
    this.messages.update(m => [...m, { sender: 'ai', text: '' }]);
    const aiIndex = this.messages().length - 1;

    let fullResponseBuffer = '';
    let displayedResponse = '';
    let isStreamComplete = false;

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
    
    const existingSession = this.history().find(h => h.id === this.currentSessionId());
    const title = existingSession?.title || this.generateTitle(msgs);
    
    this.chatService.saveSession({
      id: this.currentSessionId(),
      title,
      messages: msgs,
      timestamp: Date.now()
    });
    this.loadHistory();
  }

  private generateTitle(messages: ChatMessage[]): string {
    const firstUserMsg = messages.find(m => m.sender === 'user');
    return firstUserMsg ?  firstUserMsg.text.substring(0, 30) + '...' : 'Nuova Chat';
  }
}