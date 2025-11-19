import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cohorte } from './cohorte.entity';
import { User } from '../../../user/entities/user.entity';

export enum FileType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  SPREADSHEET = 'SPREADSHEET',
  PRESENTATION = 'PRESENTATION',
  AUDIO = 'AUDIO',
  COMPRESSED = 'COMPRESSED',
  OTHER = 'OTHER',
}

export enum MaterialCategory {
  GENERAL = 'GENERAL',
  MODULE_1 = 'MODULE_1',
  MODULE_2 = 'MODULE_2',
  MODULE_3 = 'MODULE_3',
  MODULE_4 = 'MODULE_4',
  CHECKPOINT = 'CHECKPOINT',
  PROYECTO = 'PROYECTO',
  RECURSOS = 'RECURSOS',
  EVALUACIONES = 'EVALUACIONES',
}

@Entity('cohorte_materials')
export class CohorteMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relaciones
  @Column({ name: 'cohorte_id', type: 'uuid' })
  cohorteId: string;

  @ManyToOne(() => Cohorte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cohorte_id' })
  cohorte: Cohorte;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  // Información del archivo
  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_url', length: 1000 })
  fileUrl: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
  })
  fileType: FileType;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  // Clasificación
  @Column({
    type: 'enum',
    enum: MaterialCategory,
    default: MaterialCategory.GENERAL,
  })
  category: MaterialCategory;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Control de visibilidad
  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  // Metadata adicional
  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({ type: 'varchar', array: true, nullable: true })
  tags: string[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
