import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFile extends Document {
  ownerId: Types.ObjectId;
  chatId?: Types.ObjectId;
  originalName: string;
  filename: string; // stored filename on disk
  mimeType: string;
  size: number;
  uploadedAt: Date;
  summary?: string;
  extractedText?: string;
  processingStatus?: 'uploaded' | 'processing' | 'completed' | 'failed';
  missingClauses?: Array<{ name: string; severity: 'red' | 'amber' | 'green'; reason?: string }>;
  severityOverall?: 'red' | 'amber' | 'green';
}

const FileSchema = new Schema<IFile>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: false, index: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
  summary: { type: String },
  extractedText: { type: String },
  processingStatus: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded', index: true },
  missingClauses: [
    {
      name: { type: String },
      severity: { type: String, enum: ['red', 'amber', 'green'] },
      reason: { type: String }
    }
  ],
  severityOverall: { type: String, enum: ['red', 'amber', 'green'] }
}, { timestamps: { createdAt: true, updatedAt: true } });

export const File = mongoose.model<IFile>('File', FileSchema);