import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../user/entities/user.entity';

export enum PostType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  userId: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Usuario;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'enum',
    enum: PostType,
    nullable: false,
    default: PostType.TEXT,
  })
  type: PostType;

  @Column({ type: 'varchar', nullable: true, name: 'media_url' })
  mediaURL: string | null;

  @Column({ type: 'boolean', default: false })
  isInappropriate: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
