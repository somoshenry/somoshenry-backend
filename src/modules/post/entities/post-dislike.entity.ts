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
import { Post } from './post.entity';
import { User } from '../../user/entities/user.entity';

@Entity('post_dislikes')
@Unique('uq_post_dislike_user_post', ['userId', 'postId'])
export class PostDislike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  postId: string;

  @ManyToOne(() => Post, (post) => post.dislikes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
