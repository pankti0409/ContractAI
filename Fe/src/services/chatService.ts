import api from './api';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatTitleInfo {
  id: string;
  title: string;
  generatedTitle?: string;
  history?: Array<{ title: string; source: 'generated' | 'manual'; at: string }>;
}

export interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'file';
  createdAt: string;
}

export interface MessageResponse {
  userMessage: Message;
  aiResponse: Message;
}

export interface CreateChatData {
  title: string;
}

export interface SendMessageData {
  chatId: string;
  content: string;
  messageType: 'text' | 'file';
  files?: string[];
}

class ChatService {
  async getChats(): Promise<Chat[]> {
    const response = await api.get('/chats');
    return response.data;
  }

  async createChat(data: CreateChatData): Promise<Chat> {
    // Retry on 429 with exponential backoff honoring Retry-After / RateLimit-Reset when present
    const maxRetries = 2;
    let attempt = 0;
    // Jitter to reduce thundering herd in case of multiple tabs/clients
    const baseDelayMs = 1000;

    // Helper to compute wait time from headers
    const computeWaitMsFromHeaders = (headers: Record<string, any>): number | null => {
      const retryAfter = headers?.['retry-after'];
      if (retryAfter) {
        // Retry-After can be seconds or HTTP-date
        const parsedSeconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(parsedSeconds)) {
          return parsedSeconds * 1000;
        }
        const dateMs = Date.parse(retryAfter);
        if (!Number.isNaN(dateMs)) {
          const delta = dateMs - Date.now();
          return delta > 0 ? delta : 0;
        }
      }
      const rateLimitReset = headers?.['ratelimit-reset'];
      if (rateLimitReset) {
        const resetSeconds = parseFloat(rateLimitReset);
        if (!Number.isNaN(resetSeconds)) {
          // Spec: reset is in seconds until reset
          return Math.max(0, Math.floor(resetSeconds * 1000));
        }
      }
      return null;
    };

    // Attempt with limited retries
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await api.post('/chats', data);
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 429 && attempt < maxRetries) {
          const waitFromHeaders = computeWaitMsFromHeaders(error.response?.headers ?? {});
          const backoff = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
          const waitMs = typeof waitFromHeaders === 'number' ? waitFromHeaders : backoff;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempt += 1;
          continue;
        }
        // Re-throw the original error for the caller to handle
        throw error;
      }
    }
  }

  async getChatById(chatId: string): Promise<{ chat: Chat; messages: Message[] }> {
    const response = await api.get(`/chats/${chatId}/messages`);
    return { chat: { id: chatId, title: '', createdAt: '', updatedAt: '' }, messages: response.data };
  }

  async sendMessage(data: SendMessageData): Promise<MessageResponse> {
    const maxRetries = 2;
    let attempt = 0;
    const baseDelayMs = 1000;

    const computeWaitMsFromHeaders = (headers: Record<string, any>): number | null => {
      const retryAfter = headers?.['retry-after'];
      if (retryAfter) {
        const parsedSeconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(parsedSeconds)) {
          return parsedSeconds * 1000;
        }
        const dateMs = Date.parse(retryAfter);
        if (!Number.isNaN(dateMs)) {
          const delta = dateMs - Date.now();
          return delta > 0 ? delta : 0;
        }
      }
      const rateLimitReset = headers?.['ratelimit-reset'];
      if (rateLimitReset) {
        const resetSeconds = parseFloat(rateLimitReset);
        if (!Number.isNaN(resetSeconds)) {
          return Math.max(0, Math.floor(resetSeconds * 1000));
        }
      }
      return null;
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await api.post(`/chats/${data.chatId}/messages`, {
          content: data.content,
          messageType: data.messageType,
          files: data.files
        });
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 429 && attempt < maxRetries) {
          const waitFromHeaders = computeWaitMsFromHeaders(error.response?.headers ?? {});
          const backoff = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
          const waitMs = typeof waitFromHeaders === 'number' ? waitFromHeaders : backoff;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempt += 1;
          continue;
        }
        throw error;
      }
    }
  }

  async streamMessage(data: SendMessageData): Promise<ReadableStream> {
    const response = await fetch(`${api.defaults.baseURL}/chats/${data.chatId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      credentials: 'include',
      body: JSON.stringify({
        content: data.content,
        messageType: data.messageType,
        files: data.files
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  }

  async deleteChat(chatId: string): Promise<void> {
    const maxRetries = 2;
    let attempt = 0;
    const baseDelayMs = 1000;

    const computeWaitMsFromHeaders = (headers: Record<string, any>): number | null => {
      const retryAfter = headers?.['retry-after'];
      if (retryAfter) {
        const parsedSeconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(parsedSeconds)) {
          return parsedSeconds * 1000;
        }
        const dateMs = Date.parse(retryAfter);
        if (!Number.isNaN(dateMs)) {
          const delta = dateMs - Date.now();
          return delta > 0 ? delta : 0;
        }
      }
      const rateLimitReset = headers?.['ratelimit-reset'];
      if (rateLimitReset) {
        const resetSeconds = parseFloat(rateLimitReset);
        if (!Number.isNaN(resetSeconds)) {
          return Math.max(0, Math.floor(resetSeconds * 1000));
        }
      }
      return null;
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await api.delete(`/chats/${chatId}`);
        return;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 429 && attempt < maxRetries) {
          const waitFromHeaders = computeWaitMsFromHeaders(error.response?.headers ?? {});
          const backoff = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
          const waitMs = typeof waitFromHeaders === 'number' ? waitFromHeaders : backoff;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          attempt += 1;
          continue;
        }
        throw error;
      }
    }
  }

  async updateChatTitle(chatId: string, title: string): Promise<Chat> {
    const response = await api.put(`/chats/${chatId}`, { title });
    return response.data.data.chat;
  }

  async getChatTitleInfo(chatId: string): Promise<ChatTitleInfo> {
    const response = await api.get(`/chats/${chatId}/title`);
    const d = response.data.data;
    return {
      id: d.id,
      title: d.title,
      generatedTitle: d.generatedTitle,
      history: Array.isArray(d.history)
        ? d.history.map((h: any) => ({ title: h.title, source: h.source, at: new Date(h.at).toISOString() }))
        : []
    };
  }

  async searchChats(query: string): Promise<Chat[]> {
    const response = await api.get(`/chats/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }
}

export default new ChatService();