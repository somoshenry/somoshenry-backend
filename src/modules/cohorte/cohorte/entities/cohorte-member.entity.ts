import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../user/entities/user.entity';
import { Cohorte } from './cohorte.entity';
import { CohorteRoleEnum, MemberStatusEnum } from '../enums/cohorte.enums';

@Entity('cohorte_members')
export class CohorteMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cohorte, (cohorte) => cohorte.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cohorteId' })
  cohorte: Cohorte;

  // @Column({ name: 'user_id', type: 'uuid', unique: true })
  // userId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CohorteRoleEnum })
  role: CohorteRoleEnum;

  @Column({
    type: 'enum',
    enum: MemberStatusEnum,
    default: MemberStatusEnum.ACTIVE,
  })
  status: MemberStatusEnum;

  @Column({ type: 'float', nullable: true })
  attendance?: number;

  @Column({ type: 'float', nullable: true })
  finalGrade?: number;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
