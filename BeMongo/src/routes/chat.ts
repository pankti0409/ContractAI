import { Router } from 'express';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { Chat, Message } from '../models/Chat';
import { File } from '../models/File';
import { generateText, qaWithFile } from '../services/llmService';

const router = Router();

// Get chats for current user
router.get('/', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const chats = await Chat.find({ ownerId: userId }).sort({ updatedAt: -1 });
  res.json(chats.map(c => ({ id: c.id, title: c.title, createdAt: c.createdAt, updatedAt: c.updatedAt })));
});

// Create a chat
router.post('/', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { title } = req.body;
  const chat = await Chat.create({ title, ownerId: userId, messages: [] });
  res.json({ id: chat.id, title: chat.title, createdAt: chat.createdAt });
});

// Update chat title (manual override) and keep naming history
router.put('/:chatId', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { chatId } = req.params;
  const { title } = req.body as { title: string };
  const chat = await Chat.findOne({ _id: chatId, ownerId: userId });
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  const clean = (title || '').toString().trim();
  if (clean.length === 0) return res.status(400).json({ message: 'Title must not be empty' });
  chat.title = clean;
  chat.titleHistory = Array.isArray(chat.titleHistory) ? chat.titleHistory : [];
  chat.titleHistory.push({ title: clean, source: 'manual', at: new Date() });
  await chat.save();
  return res.json({ data: { chat: { id: chat.id, title: chat.title, createdAt: chat.createdAt, updatedAt: chat.updatedAt } } });
});

// Retrieve title info and naming history
router.get('/:chatId/title', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { chatId } = req.params;
  const chat = await Chat.findOne({ _id: chatId, ownerId: userId });
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  return res.json({
    data: {
      id: chat.id,
      title: chat.title || '',
      generatedTitle: chat.generatedTitle || '',
      history: (chat.titleHistory || []).map(h => ({ title: h.title, source: h.source, at: h.at }))
    }
  });
});

// Get messages by chatId
router.get('/:chatId/messages', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { chatId } = req.params;
  const chat = await Chat.findOne({ _id: chatId, ownerId: userId });
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
  res.json(messages.map(m => ({ id: m.id, chatId: m.chatId, sender: m.sender, content: m.content, messageType: m.messageType, files: m.files, createdAt: m.createdAt })));
});

// Send message and echo bot response
router.post('/:chatId/messages', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { chatId } = req.params;
  const { content, messageType, files } = req.body as { content: string; messageType?: 'text'|'file'|'system'; files?: string[] };
  const chat = await Chat.findOne({ _id: chatId, ownerId: userId });
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  let fileRefs: Array<{ id: string; filename: string; url: string; size?: number; type?: string }> | undefined = undefined;
  let firstFileDoc: any | undefined = undefined;
  if (Array.isArray(files) && files.length > 0) {
    const found = await File.find({ _id: { $in: files }, ownerId: userId });
    fileRefs = found.map(f => ({ id: f.id, filename: f.originalName, url: `/api/files/${f.id}/download`, size: f.size, type: f.mimeType }));
    if (found.length > 0) firstFileDoc = found[0];
  }
  const userMsg = await Message.create({ chatId, sender: 'user', content, messageType: messageType || 'text', files: fileRefs });
  chat.messages.push(userMsg._id as any);
  chat.updatedAt = new Date();
  await chat.save();

  // Generate bot reply: if a file is attached, answer using only that document via QA
  let botContent = '';
  try {
    if (fileRefs && fileRefs.length > 0 && firstFileDoc) {
      const absPath = path.join(process.cwd(), 'uploads', firstFileDoc.filename);
      botContent = await qaWithFile(absPath, content);
    } else {
      const systemPrompt = 'You are ContractAI, a helpful legal assistant. Reply concisely.';
      const prompt = `${systemPrompt}\nUser: ${content}\nAssistant:`;
      botContent = await generateText(prompt);
    }
  } catch (e) {
    console.error('LLM generation failed:', e);
    botContent = 'Sorry, I could not generate a response at the moment.';
  }
  const botMsg = await Message.create({ chatId, sender: 'bot', content: botContent, messageType: 'text' });
  chat.messages.push(botMsg._id as any);
  chat.updatedAt = new Date();
  await chat.save();

  res.json({
    userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
    aiResponse: { id: botMsg.id, content: botMsg.content, createdAt: botMsg.createdAt }
  });
});

// Delete a chat and its messages
router.delete('/:chatId', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { chatId } = req.params;
  const chat = await Chat.findOne({ _id: chatId, ownerId: userId });
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  await Message.deleteMany({ chatId });
  await Chat.deleteOne({ _id: chatId });
  return res.status(204).send();
});

export default router;