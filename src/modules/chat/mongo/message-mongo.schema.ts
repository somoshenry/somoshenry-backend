import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageMongoDocument = MessageMongo & Document;

@Schema({
  timestamps: true,
  collection: 'messages', // Nombre de la colección en MongoDB
})
export class MessageMongo {
  @Prop({ required: true, index: true })
  conversationId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: false })
  content?: string;

  @Prop({ required: false, default: 'TEXT' })
  type?: string;

  @Prop({ type: Object, required: false })
  attachments?: Record<string, unknown>;

  // marcar como leído
  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageMongoSchema = SchemaFactory.createForClass(MessageMongo);

// Índices para mejorar performance
MessageMongoSchema.index({ conversationId: 1, createdAt: -1 });
MessageMongoSchema.index({ senderId: 1 });
