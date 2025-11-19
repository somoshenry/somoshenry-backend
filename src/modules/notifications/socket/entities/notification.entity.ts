import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../user/entities/user.entity';

export enum NotificationType {
  LIKE_POST = 'LIKE_POST',
  LIKE_COMMENT = 'LIKE_COMMENT',
  COMMENT_POST = 'COMMENT_POST',
  REPLY_COMMENT = 'REPLY_COMMENT',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_MESSAGE = 'NEW_MESSAGE',
  COHORTE_INVITATION = 'COHORTE_INVITATION',
}

@Entity('notifications')
@Index(['receiverId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  receiverId: string;

  @ManyToOne(() => User, (user) => user.receivedNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column('uuid')
  senderId: string;

  @ManyToOne(() => User, (user) => user.sentNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  // 🔹 JSON estructurado para guardar datos flexibles del evento
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
