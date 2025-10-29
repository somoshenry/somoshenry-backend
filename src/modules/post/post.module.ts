import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { Usuario } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Usuario])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
