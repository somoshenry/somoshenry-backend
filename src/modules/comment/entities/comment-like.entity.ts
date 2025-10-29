import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../../user/entities/user.entity';

@Entity('comment_likes')
@Unique('uq_comment_like_user_comment', ['userId', 'commentId'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
