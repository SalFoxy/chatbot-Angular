import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  async streamAnswer(message: string, onChunk: (text: string) => void) {
    const response = await fetch(
      `http://localhost:8080/ai/generateStream?message=${encodeURIComponent(message)}`
    );

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Chiama Angular per ogni parte della risposta
      onChunk(chunk);
    }
  }
}
