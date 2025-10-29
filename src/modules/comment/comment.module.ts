import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity'; // 👈 Asegurate de importar esto
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentLike]), // 👈 Ambas entidades deben ir acá
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
