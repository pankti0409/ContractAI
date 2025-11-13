import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { File } from '../models/File';
import { Chat, Message } from '../models/Chat';
import { summarizeFile, generateChatNameFromText } from '../services/llmService';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}_${safeBase}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type. Only PDF, DOCX, and TXT are supported.'));
  }
});

// Upload a file and associate to a chatId (optional)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const auth = (req as any).auth;
    const { chatId } = req.body as { chatId?: string };

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Validate chat ownership if chatId provided
    let chatObjectId: any = undefined;
    if (chatId) {
      const chat = await Chat.findOne({ _id: chatId, ownerId: auth.sub });
      if (!chat) return res.status(404).json({ message: 'Chat not found' });
      chatObjectId = chat._id;
    }

    const created = await File.create({
      ownerId: auth.sub,
      chatId: chatObjectId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      processingStatus: 'uploaded'
    });

    // Processing pipeline: text extraction, summary (5-7 lines), missing clause severity
    try {
      created.processingStatus = 'processing';
      await created.save();

      const abs = path.join(uploadDir, created.filename);
      const { extractTextFromFile } = await import('../services/textExtractionService');
      const { extractContractClauses } = await import('../services/llmService');

      // Extract text with OCR fallback
      const extractedText = await extractTextFromFile(abs);
      created.extractedText = extractedText;

      // Summarize in 6 concise bullet points
      const summary = await summarizeFile(abs, 6);
      created.summary = summary;

      // Parse clauses and compute missing clause severities
      const { clauses } = await extractContractClauses(extractedText);
      const empty = (v?: string) => !v || v.trim().length === 0;
      const missing: Array<{ name: string; severity: 'red' | 'amber' | 'green'; reason?: string }> = [];
      const pushMissing = (name: string, severity: 'red'|'amber'|'green', reason?: string) => missing.push({ name, severity, reason });

      if (empty(clauses.parties)) pushMissing('Parties', 'red', 'No parties identified');
      if (empty(clauses.signatories)) pushMissing('Signatories', 'red', 'No signature/signatory section');
      if (empty(clauses.governingLaw)) pushMissing('Governing Law', 'red', 'No governing law specified');

      if (empty(clauses.termination)) pushMissing('Termination', 'amber', 'Termination terms missing');
      if (empty(clauses.liability)) pushMissing('Liability', 'amber', 'Liability allocation missing');
      if (empty(clauses.confidentiality)) pushMissing('Confidentiality', 'amber', 'Confidentiality terms missing');
      if (empty(clauses.payment)) pushMissing('Payment', 'amber', 'Payment terms missing');

      if (empty(clauses.disputeResolution)) pushMissing('Dispute Resolution', 'amber', 'Dispute resolution mechanism missing');
      if (empty(clauses.term)) pushMissing('Term', 'amber', 'Contract duration missing');

      created.missingClauses = missing;
      created.severityOverall = missing.some(m => m.severity === 'red')
        ? 'red'
        : missing.some(m => m.severity === 'amber')
          ? 'amber'
          : 'green';

      created.processingStatus = 'completed';
      await created.save();

      // If associated to a chat, generate and persist a chat name (3-5 words)
      if (chatObjectId) {
        try {
          const proposed = await generateChatNameFromText(extractedText || created.originalName || '');
          const chatDoc = await Chat.findOne({ _id: chatObjectId, ownerId: auth.sub });
          if (chatDoc) {
            const shouldSet = !chatDoc.title || chatDoc.title.trim().length === 0 || chatDoc.title === 'New Chat';
            if (shouldSet) {
              chatDoc.title = proposed;
              chatDoc.generatedTitle = proposed;
              chatDoc.titleHistory = Array.isArray(chatDoc.titleHistory) ? chatDoc.titleHistory : [];
              chatDoc.titleHistory.push({ title: proposed, source: 'generated', at: new Date() });
              await chatDoc.save();
            }
          }
        } catch (e) {
          console.warn('Failed to generate chat name:', e);
        }

        // Persist a bot summary message in the chat so it survives refresh
        try {
          const severityOverall = created.severityOverall || 'green';
          const missingList = Array.isArray(created.missingClauses) ? created.missingClauses : [];
          const missingText = missingList.length > 0
            ? `\n\nMissing Clauses (${severityOverall.toUpperCase()}):\n` + missingList.map((m) => `- ${m.name} (${m.severity})${m.reason ? ` — ${m.reason}` : ''}`).join('\n')
            : '\n\nMissing Clauses: None (GREEN)';
          const fullText = `Summary of ${created.originalName}:\n${created.summary || ''}${missingText}`;
          const botMsg = await Message.create({
            chatId: chatObjectId,
            sender: 'bot',
            content: fullText,
            messageType: 'text',
            files: [{ id: created.id, filename: created.originalName, url: `/api/files/${created.id}/download`, size: created.size, type: created.mimeType }]
          });
          const chatDoc = await Chat.findOne({ _id: chatObjectId, ownerId: auth.sub });
          if (chatDoc) {
            chatDoc.messages.push(botMsg._id as any);
            chatDoc.updatedAt = new Date();
            await chatDoc.save();
          }
        } catch (e) {
          console.warn('Failed to persist summary message:', e);
        }
      }
    } catch (e: any) {
      console.warn('Processing failed for uploaded file:', e);
      created.processingStatus = 'failed';
      await created.save();
    }

    const dto = {
      id: created.id,
      filename: created.filename,
      originalName: created.originalName,
      mimeType: created.mimeType,
      size: created.size,
      uploadedAt: created.uploadedAt.toISOString(),
      summary: created.summary ?? '',
      processingStatus: created.processingStatus,
      missingClauses: created.missingClauses ?? [],
      severityOverall: created.severityOverall ?? 'green'
    };

    return res.json({ data: dto });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
});

// List files for a chat owned by current user
router.get('/chats/:chatId', requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth;
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, ownerId: auth.sub });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

  const files = await File.find({ chatId: chatId, ownerId: auth.sub }).sort({ uploadedAt: -1 });
  const list = files.map(f => ({
    id: f.id,
    filename: f.filename,
    originalName: f.originalName,
    mimeType: f.mimeType,
    size: f.size,
    uploadedAt: f.uploadedAt.toISOString(),
    processingStatus: f.processingStatus ?? 'uploaded'
  }));
  return res.json({ data: list });
  } catch (err) {
    console.error('Get chat files error:', err);
    return res.status(500).json({ message: 'Failed to get files' });
  }
});

// Download a file
router.get('/:fileId/download', requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const { fileId } = req.params;
  const file = await File.findOne({ _id: fileId, ownerId: auth.sub });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const abs = path.join(uploadDir, file.filename);
  if (!fs.existsSync(abs)) return res.status(404).json({ message: 'File content missing' });
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  fs.createReadStream(abs).pipe(res);
});

// Basic text extraction for plain text files
router.get('/:fileId/text', requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const { fileId } = req.params;
  const file = await File.findOne({ _id: fileId, ownerId: auth.sub });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const abs = path.join(uploadDir, file.filename);
  if (!fs.existsSync(abs)) return res.status(404).json({ message: 'File content missing' });

  let extractedText = 'Preview not available for this file type.';
  if (file.mimeType === 'text/plain') {
    extractedText = fs.readFileSync(abs, 'utf-8');
  }
  return res.json({ data: { fileId: file.id, originalName: file.originalName, extractedText, mimeType: file.mimeType } });
});

// Get stored summary for a file
router.get('/:fileId/summary', requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const { fileId } = req.params;
  const file = await File.findOne({ _id: fileId, ownerId: auth.sub });
  if (!file) return res.status(404).json({ message: 'File not found' });
  return res.json({ data: { fileId: file.id, originalName: file.originalName, summary: file.summary ?? '' } });
});

// Delete a file
router.delete('/:fileId', requireAuth, async (req, res) => {
  const auth = (req as any).auth;
  const { fileId } = req.params;
  const file = await File.findOne({ _id: fileId, ownerId: auth.sub });
  if (!file) return res.status(404).json({ message: 'File not found' });
  const abs = path.join(uploadDir, file.filename);
  await File.deleteOne({ _id: fileId });
  if (fs.existsSync(abs)) {
    fs.unlinkSync(abs);
  }
  return res.status(204).send();
});

export default router;