import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { PostLike } from './post-like.entity';
import { PostDislike } from './post-dislike.entity';
import { PostView } from './post-view.entity';

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

  @ManyToOne(() => User, (usuario) => usuario.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

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

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostLike, (like) => like.post, { cascade: true })
  likes: PostLike[];

  @OneToMany(() => PostDislike, (dislike) => dislike.post, { cascade: true })
  dislikes: PostDislike[];

  @Column({ type: 'int', default: 0 })
  dislikeCount: number;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @OneToMany(() => PostView, (view) => view.post, { cascade: true })
  views: PostView[];

  @Column({ type: 'uuid', nullable: true })
  moderatedBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  moderatedAt?: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moderatedBy' })
  moderator?: User;
}
