import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  sender: 'user' | 'bot';
  content: string;
  messageType: 'text' | 'file' | 'system';
  files?: any[];
  createdAt: Date;
}

export interface IChat extends Document {
  title?: string;
  generatedTitle?: string;
  titleHistory?: Array<{ title: string; source: 'generated' | 'manual'; at: Date }>;
  ownerId: Types.ObjectId;
  messages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, default: '' },
  messageType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  files: [Schema.Types.Mixed],
}, { timestamps: { createdAt: true, updatedAt: true } });

const ChatSchema = new Schema<IChat>({
  title: { type: String },
  generatedTitle: { type: String },
  titleHistory: [{
    title: { type: String, required: true },
    source: { type: String, enum: ['generated', 'manual'], required: true },
    at: { type: Date, default: Date.now }
  }],
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Chat = mongoose.model<IChat>('Chat', ChatSchema);