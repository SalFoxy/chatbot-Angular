import { Injectable } from '@angular/core';
import { ChatRequest, ChatSession, ChatMessage } from '../../features/chat/models/chat.models';

// Re-export per retrocompatibilità
export { ChatRequest, ChatSession, ChatMessage };

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

    const reader = response.body?. getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }
}