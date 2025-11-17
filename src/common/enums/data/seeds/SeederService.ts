import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../../../modules/user/entities/user.entity';
import { Post, PostType } from '../../../../modules/post/entities/post.entity';
import { Comment } from '../../../../modules/comment/entities/comment.entity';
import { PostLike } from '../../../../modules/post/entities/post-like.entity';
import { CommentLike } from '../../../../modules/comment/entities/comment-like.entity';

import usersData from '../users.json';
import postsData from '../posts.json';
import commentsData from '../comments.json';
import postLikesData from '../post_likes.json';
import commentLikesData from '../comment_likes.json';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(PostLike)
    private readonly postLikeRepo: Repository<PostLike>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
  ) {}

  async run(): Promise<void> {
    console.log('🌱 Iniciando mockeo…');

    const savedUsers = await this.userRepo.save(
      usersData.map((u) => this.userRepo.create(u)),
    );

    const getUser = (index: number): User =>
      savedUsers[index - 1] ?? savedUsers[0];

    const savedPosts = await this.postRepo.save(
      postsData.map((p) =>
        this.postRepo.create({
          content: p.content,
          type: (Object.values(PostType) as string[]).includes(p.type)
            ? (p.type as PostType)
            : PostType.TEXT,
          user: getUser(Number(p.userId)),
        }),
      ),
    );

    const getPost = (index: number): Post =>
      savedPosts[index - 1] ?? savedPosts[0];

    const savedComments = await this.commentRepo.save(
      commentsData.map((c) =>
        this.commentRepo.create({
          content: c.content,
          post: getPost(Number(c.postId)),
          author: getUser(Number(c.userId)),
        }),
      ),
    );

    const getComment = (index: number): Comment =>
      savedComments[index - 1] ?? savedComments[0];

    await this.postLikeRepo.save(
      postLikesData.map((l) =>
        this.postLikeRepo.create({
          user: getUser(Number(l.userId)),
          post: getPost(Number(l.postId)),
        }),
      ),
    );

    await this.commentLikeRepo.save(
      commentLikesData.map((l) =>
        this.commentLikeRepo.create({
          user: getUser(Number(l.userId)),
          comment: getComment(Number(l.commentId)),
        }),
      ),
    );

    const [uc, pc, cc, plc, clc] = await Promise.all([
      this.userRepo.count(),
      this.postRepo.count(),
      this.commentRepo.count(),
      this.postLikeRepo.count(),
      this.commentLikeRepo.count(),
    ]);

    console.log(
      ` Usuarios: ${uc} | Posts: ${pc} | Comments: ${cc} | PostLikes: ${plc} | CommentLikes: ${clc}`,
    );
    console.log(' Mockeo completado.');
  }
}
