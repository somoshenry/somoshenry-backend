import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ConversationParticipant } from './conversation-participant.entity';

export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  COHORT = 'COHORT',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'conversation_users',
    joinColumn: { name: 'conversation_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  participants: User[];

  @OneToMany(() => ConversationParticipant, (p) => p.conversation, {
    cascade: true,
  })
  participantsWithRoles: ConversationParticipant[];

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.PRIVATE,
  })
  type: ConversationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
