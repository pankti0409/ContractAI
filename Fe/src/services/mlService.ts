import api from './api';

export interface GenerateRequest {
  prompt: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export async function generate(req: GenerateRequest): Promise<string> {
  const res = await api.post('/ml/generate', req);
  return res.data.text;
}

export async function analyzeText(text: string): Promise<{ analysis: string; summary: string }> {
  const res = await api.post('/ml/analyze/text', { text });
  return res.data;
}

export async function analyzeFile(fileId: string): Promise<{ analysis: string; summary: string }> {
  const res = await api.post('/ml/analyze/file', { fileId });
  return res.data;
}

export async function summarizeFileById(fileId: string, maxSentences = 6): Promise<string> {
  const res = await api.post('/ml/summarize/file', { fileId, maxSentences });
  return res.data.summary;
}

export async function qaFile(fileId: string, question: string): Promise<string> {
  const res = await api.post('/ml/qa/file', { fileId, question });
  return res.data.text;
}

export default { generate, analyzeText, analyzeFile, summarizeFileById, qaFile };