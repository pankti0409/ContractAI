import { Router } from 'express';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { File } from '../models/File';
import { analyzeAndSummarizeFile, analyzeAndSummarizeText, generateText, summarizeFile, qaWithFile, extractContractClauses } from '../services/llmService';

const router = Router();

// Text generation
router.post('/generate', requireAuth, async (req, res) => {
  const { prompt, temperature, topP, maxTokens } = req.body as { prompt: string; temperature?: number; topP?: number; maxTokens?: number };
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'prompt is required' });
  }
  try {
    const start = Date.now();
    const text = await generateText(prompt, { temperature, topP, maxTokens });
    const durationMs = Date.now() - start;
    return res.json({ text, durationMs });
  } catch (e: any) {
    console.error('Proxy /ml/generate failed:', e);
    return res.status(502).json({ message: 'Generation failed', error: String(e?.message || e) });
  }
});

// Analyze a stored file by id
router.post('/analyze/file', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { fileId } = req.body as { fileId: string };
  if (!fileId) return res.status(400).json({ message: 'fileId is required' });
  const file = await File.findOne({ _id: fileId, ownerId: userId });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const absPath = path.join(process.cwd(), 'uploads', file.filename || file.originalName);
  try {
    const start = Date.now();
    const result = await analyzeAndSummarizeFile(absPath);
    const durationMs = Date.now() - start;
    return res.json({ ...result, durationMs });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const isClientErr = msg.includes('Unsupported file type') || msg.includes('File not found') || msg.includes('PDF') || msg.includes('Unable to extract text');
    console.error('Proxy /ml/analyze/file failed:', e);
    return res.status(isClientErr ? 400 : 502).json({ message: 'Analyze failed', error: msg });
  }
});

// Analyze raw text content
router.post('/analyze/text', requireAuth, async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ message: 'text is required' });
  try {
    const start = Date.now();
    const result = await analyzeAndSummarizeText(text);
    const durationMs = Date.now() - start;
    return res.json({ ...result, durationMs });
  } catch (e: any) {
    console.error('Proxy /ml/analyze/text failed:', e);
    return res.status(502).json({ message: 'Analyze failed', error: String(e?.message || e) });
  }
});

// Summarize a stored file by id
router.post('/summarize/file', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { fileId, maxSentences } = req.body as { fileId: string; maxSentences?: number };
  if (!fileId) return res.status(400).json({ message: 'fileId is required' });
  const file = await File.findOne({ _id: fileId, ownerId: userId });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const absPath = path.join(process.cwd(), 'uploads', file.filename);
  try {
    const start = Date.now();
    const summary = await summarizeFile(absPath, maxSentences);
    const durationMs = Date.now() - start;
    return res.json({ summary, durationMs });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const isClientErr = msg.includes('Unsupported file type') || msg.includes('File not found') || msg.includes('PDF') || msg.includes('Unable to extract text');
    console.error('Proxy /ml/summarize/file failed:', e);
    return res.status(isClientErr ? 400 : 502).json({ message: 'Summarize failed', error: msg });
  }
});

// QA over a stored file by id
router.post('/qa/file', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { fileId, question } = req.body as { fileId: string; question: string };
  if (!fileId || !question) return res.status(400).json({ message: 'fileId and question are required' });
  const file = await File.findOne({ _id: fileId, ownerId: userId });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const absPath = path.join(process.cwd(), 'uploads', file.filename);
  try {
    const start = Date.now();
    const text = await qaWithFile(absPath, question);
    const durationMs = Date.now() - start;
    return res.json({ text, durationMs });
  } catch (e: any) {
    console.error('Proxy /ml/qa/file failed:', e);
    return res.status(502).json({ message: 'QA failed', error: String(e?.message || e) });
  }
});

// Structured clause parsing for a contract (text or fileId)
router.post('/parse/contract', requireAuth, async (req, res) => {
  const userId = (req as any).auth.sub;
  const { text, fileId } = req.body as { text?: string; fileId?: string };
  try {
    let inputText = text;
    if (!inputText && fileId) {
      const file = await File.findOne({ _id: fileId, ownerId: userId });
      if (!file) return res.status(404).json({ message: 'File not found' });
      const abs = path.join(process.cwd(), 'uploads', file.filename);
      // reuse summarize path to read content
      const { extractTextFromFile } = await import('../services/textExtractionService');
      inputText = await extractTextFromFile(abs);
    }
    if (!inputText) return res.status(400).json({ message: 'Provide text or fileId' });
    const start = Date.now();
    const result = await extractContractClauses(inputText);
    const durationMs = Date.now() - start;
    return res.json({ ...result, durationMs });
  } catch (e: any) {
    console.error('Proxy /ml/parse/contract failed:', e);
    return res.status(502).json({ message: 'Parse failed', error: String(e?.message || e) });
  }
});

export default router;