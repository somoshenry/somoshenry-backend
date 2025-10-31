import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { CommentLike } from './comment-like.entity';

@Entity('comments')
@Index(['postId', 'parentId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  postId: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  @Index()
  authorId: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  parentId?: string | null;

  @ManyToOne(() => Comment, (comment) => comment.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isInappropriate: boolean;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  replyCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommentLike, (like) => like.comment)
  likes: CommentLike[];
}
