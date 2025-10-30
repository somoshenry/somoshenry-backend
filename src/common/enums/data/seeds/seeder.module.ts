import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './SeederService';

import { User } from '../../../../modules/user/entities/user.entity';
import { Post } from '../../../../modules/post/entities/post.entity';
import { Comment } from '../../../../modules/comment/entities/comment.entity';
import { PostLike } from '../../../../modules/post/entities/post-like.entity';
import { CommentLike } from '../../../../modules/comment/entities/comment-like.entity';

@Module({
  imports: [
    // Repos necesarios para inyectar en el seeder
    TypeOrmModule.forFeature([User, Post, Comment, PostLike, CommentLike]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
