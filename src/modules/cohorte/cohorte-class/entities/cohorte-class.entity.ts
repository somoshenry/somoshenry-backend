import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Cohorte } from '../../cohorte/entities/cohorte.entity';
import { User } from '../../../user/entities/user.entity';
import { ClassStatusEnum } from '../../cohorte/enums/cohorte.enums';
import { ClassAttendance } from './class-attendance.entity';

@Entity('cohorte_classes')
export class CohorteClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cohorte, (cohorte) => cohorte.classes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cohorteId' })
  cohorte: Cohorte;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, nullable: true })
  module?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher?: User;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recordingUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  materialsUrl?: string;

  @Column({
    type: 'enum',
    enum: ClassStatusEnum,
    default: ClassStatusEnum.SCHEDULED,
  })
  status: ClassStatusEnum;

  @OneToMany(() => ClassAttendance, (attendance) => attendance.classSession)
  attendances: ClassAttendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ...
  @Column({ type: 'varchar', length: 100, nullable: true })
  rtcRoomId?: string; // para WebRTC a futuro
  // ...
}
