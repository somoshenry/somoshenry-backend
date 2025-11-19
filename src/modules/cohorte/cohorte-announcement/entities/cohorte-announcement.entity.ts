import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Cohorte } from '../../cohorte/entities/cohorte.entity';
import { User } from '../../../user/entities/user.entity';

@Entity('cohorte_announcements')
export class CohorteAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cohorte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cohorteId' })
  cohorte: Cohorte;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  pinned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
