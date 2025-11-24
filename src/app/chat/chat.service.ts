import { Injectable } from '@angular/core';

// --- INTERFACCE CONDIVISE ---
export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  conversationId: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  
  private apiUrl = 'http://localhost:8080/ai/generateStream'; 
  private storageKey = 'lipari_chat_history_v1';

  // --- GESTIONE CRONOLOGIA (LocalStorage) ---

  getHistory(): ChatSession[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("LocalStorage non accessibile:", e);
      return [];
    }
  }

  saveSession(session: ChatSession) {
    try {
      const history = this.getHistory();
      const index = history.findIndex(h => h.id === session.id);
      
      if (index >= 0) {
        history[index] = session; // Aggiorna esistente
      } else {
        history.unshift(session); // Aggiungi nuova in cima
      }
      
      // Mantieni solo le ultime 20 chat
      if (history.length > 20) history.pop();
      
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (e) {
      console.error("Errore salvataggio sessione:", e);
    }
  }

  deleteSession(id: string) {
    let history = this.getHistory();
    history = history.filter(h => h.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
    return history;
  }

  // --- CHIAMATA API ---

  async streamAnswer(payload: ChatRequest, onChunk: (chunk: string) => void) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      console.error(error);
      onChunk("\n[Errore di connessione al server]");
      throw error;
    }
  }
}