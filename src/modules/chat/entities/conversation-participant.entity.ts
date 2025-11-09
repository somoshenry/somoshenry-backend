import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Unique,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../user/entities/user.entity';

export enum ConversationRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  MUTED = 'MUTED',
}

@Entity('conversation_participants_roles')
@Unique(['conversation', 'user'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Conversation,
    (conversation) => conversation.participantsWithRoles,
    {
      onDelete: 'CASCADE',
    },
  )
  @Index()
  conversation: Conversation;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: ConversationRole,
    default: ConversationRole.MEMBER,
  })
  role: ConversationRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
