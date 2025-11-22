// chat.service.ts
import { Injectable } from '@angular/core';
import { ChatRequest } from './chat.component'; // Importa l'interfaccia o definiscila qui

@Injectable({ providedIn: 'root' })
export class ChatService {
  
  private apiUrl = 'http://localhost:8080/ai/generateStream'; // Il tuo URL Spring Boot

  async streamAnswer(payload: ChatRequest, onChunk: (chunk: string) => void) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) // Trasformiamo l'oggetto in stringa JSON
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
  }
}