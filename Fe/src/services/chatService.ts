import api from './api';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  messageType: 'user' | 'assistant';
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
  messageType: 'user';
}

class ChatService {
  async getChats(): Promise<Chat[]> {
    const response = await api.get('/chats');
    return response.data.data.data;
  }

  async createChat(data: CreateChatData): Promise<Chat> {
    const response = await api.post('/chats', data);
    return response.data.data;
  }

  async getChatById(chatId: string): Promise<{ chat: Chat; messages: Message[] }> {
    const response = await api.get(`/chats/${chatId}`);
    const chatData = response.data.data.chat;
    return {
      chat: chatData,
      messages: chatData.messages || []
    };
  }

  async sendMessage(data: SendMessageData): Promise<MessageResponse> {
    const response = await api.post(`/chats/${data.chatId}/messages`, {
      content: data.content,
      messageType: data.messageType
    });
    return response.data.data;
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
        messageType: data.messageType
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  }

  async deleteChat(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}`);
  }

  async updateChatTitle(chatId: string, title: string): Promise<Chat> {
    const response = await api.put(`/chats/${chatId}`, { title });
    return response.data.data.chat;
  }

  async searchChats(query: string): Promise<Chat[]> {
    const response = await api.get(`/chats/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }
}

export default new ChatService();