import { Injectable } from '@angular/core';
import { ChatRequest, ChatSession } from '../models/chat.models';

const STORAGE_KEY = 'chat_history';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = 'http://localhost:8080/api';

  async streamAnswer(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${this.apiUrl}/ai/generateStream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }

  getHistory(): ChatSession[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    try {
      const sessions = JSON.parse(data) as ChatSession[];
      return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  saveSession(session: ChatSession): void {
    const sessions = this.getHistory();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  deleteSession(id: string): ChatSession[] {
    const sessions = this.getHistory().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
  }
}