import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { CohorteClass } from './cohorte-class.entity';
import { User } from '../../../user/entities/user.entity';
import { AttendanceStatusEnum } from '../../cohorte/enums/cohorte.enums';
import { AttendanceTypeEnum } from '../../cohorte/enums/cohorte.enums';

@Entity('class_attendance')
export class ClassAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CohorteClass, (klass) => klass.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classId' })
  classSession: CohorteClass;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({
    type: 'enum',
    enum: AttendanceStatusEnum,
    default: AttendanceStatusEnum.PRESENT,
  })
  status: AttendanceStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: AttendanceTypeEnum })
  type: AttendanceTypeEnum; // STAND_UP o HANDS_ON
}
