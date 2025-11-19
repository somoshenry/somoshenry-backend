import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CohorteMember } from './cohorte-member.entity';
import { CohorteClass } from '../../cohorte-class/entities/cohorte-class.entity';
import { CohorteStatusEnum, CohorteModalityEnum } from '../enums/cohorte.enums';
import { CohorteMaterial } from './cohorte-material.entity';

@Entity('cohortes')
export class Cohorte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: CohorteStatusEnum,
    default: CohorteStatusEnum.UPCOMING,
  })
  status: CohorteStatusEnum;

  @Column({ length: 100, nullable: true })
  schedule?: string;

  @Column({
    type: 'enum',
    enum: CohorteModalityEnum,
    default: CohorteModalityEnum.FULL_TIME,
  })
  modality: CohorteModalityEnum;

  @Column({ type: 'int', nullable: true })
  maxStudents?: number;

  @OneToMany(() => CohorteMember, (member) => member.cohorte)
  members: CohorteMember[];

  @OneToMany(() => CohorteClass, (klass) => klass.cohorte)
  classes: CohorteClass[];

  @OneToMany(
    () => CohorteMaterial,
    (cohorteMaterial) => cohorteMaterial.cohorte,
  )
  cohorteMaterial: CohorteMaterial[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
