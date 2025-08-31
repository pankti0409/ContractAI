import api from './api';

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

class FileService {
  async uploadFile(file: File, chatId?: string): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (chatId) {
      formData.append('chatId', chatId);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async getFiles(): Promise<FileUpload[]> {
    const response = await api.get('/files');
    return response.data.data;
  }

  async getChatFiles(chatId: string): Promise<FileUpload[]> {
    const response = await api.get(`/files/chats/${chatId}`);
    return response.data.data.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/files/${fileId}`);
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getFileText(fileId: string): Promise<{
    fileId: string;
    originalName: string;
    extractedText: string;
    mimeType: string;
  }> {
    const response = await api.get(`/files/${fileId}/text`);
    return response.data.data;
  }

  getFileUrl(fileId: string): string {
    return `${api.defaults.baseURL}/files/${fileId}/download`;
  }

  // Helper method to validate file types
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported. Please upload PDF, Word, Excel, or text files.' };
    }

    return { valid: true };
  }
}

export default new FileService();