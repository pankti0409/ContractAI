import Groq from 'groq-sdk';
import { extractTextFromFile } from './textExtractionService';

type LlmOpts = { maxTokens?: number; temperature?: number; topP?: number };

export type ContractClauseExtraction = {
  parties?: string;
  term?: string;
  termination?: string;
  payment?: string;
  confidentiality?: string;
  liability?: string;
  governingLaw?: string;
  disputeResolution?: string;
  specialConditions?: string;
  riders?: string;
  signatories?: string;
  language?: string; // detected
};

export type ContractParseResult = {
  clauses: ContractClauseExtraction;
  errors?: string[];
};

export async function generateText(prompt: string, opts?: LlmOpts): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: opts?.temperature ?? 0.3,
    max_tokens: opts?.maxTokens ?? 800,
    top_p: opts?.topP ?? 0.9,
  });
  return completion.choices?.[0]?.message?.content || '';
}

export async function extractContractClauses(text: string): Promise<ContractParseResult> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const modelId = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const system = `You are a legal contract extraction engine.
Return a strict JSON object with fields: parties, term, termination, payment, confidentiality, liability, governingLaw, disputeResolution, specialConditions, riders, signatories, language.
If a field is missing in the text, set it to an empty string. Detect language and set 'language'. Do not include commentary.`;
  const completion = await groq.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Extract clauses from the following contract text:\n\n${text}` },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    top_p: 0.9,
    response_format: { type: 'json_object' } as any,
  });
  const content = completion.choices?.[0]?.message?.content || '{}';
  let clauses: ContractClauseExtraction = {};
  try {
    clauses = JSON.parse(content);
  } catch {
    const retry = await groq.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Extract clauses from the following contract text and return JSON only:\n\n${text}` },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      top_p: 0.9,
    });
    try { clauses = JSON.parse(retry.choices?.[0]?.message?.content || '{}'); } catch { clauses = {}; }
  }
  const errors = validateContractClauses(clauses);
  return { clauses, errors };
}

export function validateContractClauses(clauses: ContractClauseExtraction): string[] {
  const errs: string[] = [];
  const empty = (v?: string) => !v || v.trim().length === 0;
  if (empty(clauses.parties)) errs.push('Missing parties clause');
  if (empty(clauses.signatories)) errs.push('Missing signatures/signatory information');
  if (empty(clauses.term)) errs.push('Missing term clause');
  if (empty(clauses.governingLaw)) errs.push('Missing governing law clause');
  return errs;
}

// moved to textExtractionService

export async function analyzeAndSummarizeText(text: string, opts?: LlmOpts): Promise<{ analysis: string; summary: string }> {
  const system = 'You are a precise legal assistant. Analyze documents and summarize key clauses.';
  const analysisPrompt = `${system}
Analyze the following contract text. Extract and label key clauses (Parties, Term, Termination, Payment, Confidentiality, Liability, Governing Law, Dispute Resolution). Provide brief, bullet-point insights and cite exact phrases when relevant.

Text:
${text}`;
  const summaryPrompt = `${system}
Summarize the contract in 6-8 bullet points suitable for a business stakeholder. Focus on obligations, risks, termination, and unusual terms.

Text:
${text}`;
  const analysis = await generateText(analysisPrompt, opts);
  const summary = await generateText(summaryPrompt, opts);
  return { analysis, summary };
}

export async function analyzeAndSummarizeFile(absPath: string, opts?: LlmOpts): Promise<{ analysis: string; summary: string }> {
  const text = await extractTextFromFile(absPath);
  return await analyzeAndSummarizeText(text, opts);
}

export async function summarizeFile(absPath: string, maxSentences = 6, opts?: LlmOpts): Promise<string> {
  const text = await extractTextFromFile(absPath);
  const prompt = `Summarize the following contract in ${maxSentences} concise bullet points focusing on parties, key obligations, payment, termination, confidentiality, governing law, and risks.\n\n${text}`;
  return await generateText(prompt, { ...opts, maxTokens: opts?.maxTokens ?? 800, temperature: opts?.temperature ?? 0.2, topP: opts?.topP ?? 0.9 });
}

export async function qaWithFile(absPath: string, question: string, opts?: LlmOpts): Promise<string> {
  const text = await extractTextFromFile(absPath);
  const prompt = `You are a legal assistant. Answer the question using ONLY the provided document text. Quote relevant excerpts and keep the answer concise.\n\nQuestion: ${question}\n\nDocument Text:\n${text}`;
  return await generateText(prompt, opts);
}

// Removed legacy qaByFileId proxy; prefer direct qaWithFile at route level.

// Generate a concise, descriptive chat name (3-5 words) from document text
export async function generateChatNameFromText(text: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    // Fallback: take top words from text
    const fallback = (text || '').split(/\s+/).filter(w => /[A-Za-z]/.test(w)).slice(0, 5).join(' ').trim();
    return fallback || 'New Chat';
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const system = 'You are a naming assistant for legal document chats. Return only a short title.';
  const user = `Generate a concise (3-5 words) descriptive chat name summarizing the document topics, parties, type, and key subject. Output only the title, no punctuation beyond spaces.\n\nDocument:\n${text}`;
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.3,
    max_tokens: 32,
    top_p: 0.9,
  });
  const name = (completion.choices?.[0]?.message?.content || '').replace(/\n/g, ' ').trim();
  // Basic cleanup: limit to 5 words
  const words = name.split(/\s+/).filter(Boolean).slice(0, 5);
  return words.length > 0 ? words.join(' ') : 'New Chat';
}