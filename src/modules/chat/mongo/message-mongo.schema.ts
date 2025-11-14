import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageMongoDocument = HydratedDocument<MessageMongo>;

@Schema({ timestamps: true })
export class MessageMongo {
  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: false })
  content?: string;

  @Prop({ required: false })
  type?: string;

  @Prop({ type: Object })
  attachments?: Record<string, unknown>;

  // 👇 Las declaramos para que TS sepa que existen
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MessageMongoSchema = SchemaFactory.createForClass(MessageMongo);
