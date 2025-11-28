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