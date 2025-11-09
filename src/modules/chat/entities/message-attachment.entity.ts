import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_attachments')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (m) => m.attachments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  message: Message;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string; // image | video | audio | raw

  @Column({ type: 'varchar', length: 150, nullable: true })
  format?: string;

  @Column({ type: 'text', nullable: true })
  publicId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
