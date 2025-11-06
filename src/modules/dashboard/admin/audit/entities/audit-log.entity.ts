import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '../enums/audit-action.enum';
import { User } from '../../../../user/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  adminId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin?: User | null;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'varchar', length: 32 })
  targetType!: string;

  @Column({ type: 'varchar', length: 64 })
  targetId!: string;

  @Column({ type: 'text', nullable: true })
  details?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
