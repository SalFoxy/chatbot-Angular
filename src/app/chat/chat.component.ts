import { Component, signal, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ChatService } from './chat.service';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

// DTO per il backend
export interface ChatRequest {
  message: string;
  conversationId: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MarkdownModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewInit {

  constructor(private chatService: ChatService) {}

  // ID della conversazione (generato una volta)
  private conversationId = '';
  
  // Velocità di scrittura (ms per carattere). 
  // 10-15ms è simile a ChatGPT veloce.
  private readonly typingSpeedMs = 15; 

  messages = signal<ChatMessage[]>([
    { sender: 'ai', text: '👋 Ciao, sono LipariGPT! Come posso aiutarti?' }
  ]);

  userInput = signal('');
  isLoading = signal(false);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef<HTMLInputElement>;

  ngOnInit() {
    this.conversationId = crypto.randomUUID();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    // Piccolo timeout per permettere al DOM di aggiornarsi prima di scrollare
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        // Scrolla dolcemente se la differenza è piccola, altrimenti istantaneo
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }, 10);
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    // 1. Aggiungi messaggio User
    this.messages.update(m => [...m, { sender: 'user', text }]);
    this.userInput.set('');
    this.scrollToBottom();
    
    // 2. Blocca input
    this.isLoading.set(true);

    // 3. Prepara payload e avvia stream
    const payload: ChatRequest = {
      message: text,
      conversationId: this.conversationId
    };

    this.streamAiResponse(payload);

    this.chatInput.nativeElement.focus();
    
  }

  async streamAiResponse(payload: ChatRequest) {
    // Aggiungi messaggio AI vuoto
    this.messages.update(m => [...m, { sender: 'ai', text: '' }]);
    const aiIndex = this.messages().length - 1;

    // Variabili per gestire il buffer
    let fullResponseBuffer = '';   // Tutto il testo ricevuto dalla rete
    let displayedResponse = '';    // Il testo attualmente visibile a schermo
    let isStreamComplete = false;  // Flag per sapere quando la rete ha finito

    // --- 1. Avvia il "Typing Loop" (Scrittura fluida) ---
    const typeWriterLoop = async () => {
      // Continua finché c'è testo da scrivere O la rete sta ancora scaricando
      while (!isStreamComplete || displayedResponse.length < fullResponseBuffer.length) {
        
        if (displayedResponse.length < fullResponseBuffer.length) {
          // Prendi il prossimo carattere dal buffer
          const nextChar = fullResponseBuffer[displayedResponse.length];
          displayedResponse += nextChar;

          // Aggiorna il segnale (UI)
          this.messages.update(m => {
            const newMsgs = [...m];
            newMsgs[aiIndex] = { ...newMsgs[aiIndex], text: displayedResponse };
            return newMsgs;
          });

          this.scrollToBottom();
          
          // Attesa per l'effetto macchina da scrivere
          await new Promise(resolve => setTimeout(resolve, this.typingSpeedMs));
        } else {
          // Se siamo in pari col buffer ma la rete non ha finito, aspettiamo un attimo
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Quando tutto è finito
      this.isLoading.set(false);
    };

    // Avvia il loop di scrittura in parallelo (non await qui!)
    typeWriterLoop();

    // --- 2. Avvia la chiamata di rete (Riempie il buffer) ---
    try {
      await this.chatService.streamAnswer(payload, (chunk) => {
        fullResponseBuffer += chunk; // Riempie solo il buffer nascosto
      });
    } catch (error) {
      console.error(error);
      fullResponseBuffer += "\n[Errore di connessione]";
    } finally {
      isStreamComplete = true; // Segnala al loop di scrittura che non arriverà altro
    }
  }
}