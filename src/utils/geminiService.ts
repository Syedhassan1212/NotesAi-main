import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class GeminiService {
  private model: any;
  private chat: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.chat = this.model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 10,
      },
    });
  }

  async sendMessage(message: string, image?: string): Promise<string> {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'test_key') {
        throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
      }

      let content: any = message;
      
      // If there's an image, include it in the message
      if (image) {
        content = [
          {
            text: message,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: image,
            },
          },
        ];
      }

      const result = await this.chat.sendMessage(content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get response from AI. Please check your API key and try again.');
    }
  }

  // Reset chat history
  resetChat() {
    this.chat = this.model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 10,
      },
    });
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
