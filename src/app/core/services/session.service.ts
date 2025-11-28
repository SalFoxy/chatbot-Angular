import { Injectable, signal } from '@angular/core';
import { ChatMessage, ChatSession } from '../../features/chat/models/chat.models';

const STORAGE_KEY = 'chat_history';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  history = signal<ChatSession[]>([]);
  currentSessionId = signal<string>('');

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const sessions = JSON.parse(data) as ChatSession[];
        // Ordina per timestamp decrescente
        sessions.sort((a, b) => b.timestamp - a.timestamp);
        this.history.set(sessions);
      } catch {
        this.history.set([]);
      }
    }
  }

  saveSession(session: ChatSession): void {
    const sessions = this.history();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    this.history.set([...sessions]);
  }

  deleteSession(id: string): ChatSession[] {
    const sessions = this.history().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    this.history.set(sessions);
    return sessions;
  }

  createNewSession(): string {
    const newId = crypto.randomUUID();
    this.currentSessionId.set(newId);
    return newId;
  }

  setCurrentSession(id: string): void {
    this.currentSessionId.set(id);
  }

  getCurrentSession(): ChatSession | undefined {
    return this.history().find(s => s.id === this.currentSessionId());
  }

  generateSessionTitle(messages: ChatMessage[]): string {
    const firstUserMsg = messages.find(m => m.sender === 'user');
    return firstUserMsg 
      ? firstUserMsg.text.substring(0, 30) + '...' 
      : 'Nuova Chat';
  }
}