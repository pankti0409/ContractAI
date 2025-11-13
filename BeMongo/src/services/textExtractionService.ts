import fs from 'fs';
import path from 'path';

export async function extractTextFromFile(absPath: string): Promise<string> {
  const ext = path.extname(absPath).toLowerCase();
  if (!fs.existsSync(absPath)) throw new Error('File not found');

  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(absPath);
    try {
      const res = await pdfParse(dataBuffer);
      const txt = String(res.text || '').trim();
      if (txt.length > 0) return txt;
      throw new Error('Unable to extract text from PDF (no textual content).');
    } catch (err: any) {
      const msg = String(err?.message || err || 'Unknown PDF parse error');
      // Common pdf.js structural error for corrupted/xref issues
      if (msg.includes('bad XRef entry') || msg.includes('FormatError')) {
        throw new Error('PDF appears corrupted or scanned; text layer not readable. Try uploading a text-based PDF or DOCX.');
      }
      throw new Error(`PDF parse failed: ${msg}`);
    }
  }
  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const res = await mammoth.extractRawText({ path: absPath });
    return String(res.value || '').trim();
  }
  if (['.png', '.jpg', '.jpeg', '.tiff'].includes(ext)) {
    // Basic OCR for scanned images
    const Tesseract = await import('tesseract.js');
    const { createWorker } = Tesseract as any;
    const worker = await createWorker();
    try {
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(absPath);
      return String(data?.text || '').trim();
    } finally {
      await worker.terminate();
    }
  }
  if (ext === '.txt') {
    return fs.readFileSync(absPath, 'utf-8');
  }
  throw new Error('Unsupported file type. Supported: PDF, DOCX, TXT, PNG/JPG/JPEG/TIFF');
}