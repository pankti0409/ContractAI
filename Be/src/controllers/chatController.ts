import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import chatService from '../services/chatService';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';

class ChatController {
  createChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.userId;
    const { title, description } = req.body;

    const chat = await chatService.createChat(userId, title);

    return res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  });

  getChats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, sortBy = 'updated_at', sortOrder = 'DESC' } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await chatService.getUserChats(userId, options);

    return res.json({
      success: true,
      data: result
    });
  });

  getChatById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    const chat = await chatService.getChatById(chatId, userId);

    res.json({
      success: true,
      data: {
        chat
      }
    });
  });

  updateChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { title, description } = req.body;

    const chat = await chatService.updateChat(chatId, userId, {
      title,
      description
    });

    return res.json({
      success: true,
      message: 'Chat updated successfully',
      data: {
        chat
      }
    });
  });

  deleteChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    await chatService.deleteChat(chatId, userId);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  });

  sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { content, files, messageType = 'text' } = req.body;

    const result = await chatService.sendMessage(chatId, userId, {
      content,
      files,
      messageType
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  });

  getChatMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'ASC' } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await chatService.getChatMessages(chatId, userId, options);

    return res.json({
      success: true,
      data: result
    });
  });

  updateMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await chatService.updateMessage(messageId, userId, {
      content
    });

    return res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message
      }
    });
  });

  deleteMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    await chatService.deleteMessage(messageId, userId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  });

  searchChats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await chatService.searchChats(userId, query, options);

    return res.json({
      success: true,
      data: result
    });
  });

  getChatStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    const stats = await chatService.getChatStats(userId);

    res.json({
      success: true,
      data: {
        stats
      }
    });
  });

  exportChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { format = 'json' } = req.query;

    if (format !== 'json' && format !== 'txt') {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: json, txt'
      });
    }

    const exportData = await chatService.exportChat(chatId, userId, format as 'json' | 'txt');

    const filename = `chat-${chatId}-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'json' ? 'application/json' : 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(exportData);
  });

  // Real-time message streaming endpoint (for Server-Sent Events)
  streamMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { content, files } = req.body;

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      // Send user message first
      const result = await chatService.sendMessage(chatId, userId, {
        content,
        files,
        messageType: 'text'
      });

      // Send user message
      res.write(`data: ${JSON.stringify({
        type: 'user_message',
        data: result.userMessage
      })}\n\n`);

      // Simulate streaming AI response
      const aiResponse = result.aiResponse.content;
      const words = aiResponse.split(' ');
      
      res.write(`data: ${JSON.stringify({
        type: 'ai_message_start',
        data: { messageId: result.aiResponse.id }
      })}\n\n`);

      // Stream words with delay
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
        
        res.write(`data: ${JSON.stringify({
          type: 'ai_message_chunk',
          data: { 
            messageId: result.aiResponse.id,
            chunk: words[i] + ' ',
            isComplete: i === words.length - 1
          }
        })}\n\n`);
      }

      // Send completion
      res.write(`data: ${JSON.stringify({
        type: 'ai_message_complete',
        data: result.aiResponse
      })}\n\n`);

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({
        type: 'error',
        data: { message: errorMessage }
      })}\n\n`);
      res.end();
    }
  });
}

export default new ChatController();