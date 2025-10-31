import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Request } from 'express';
import { Comment } from './entities/comment.entity';

@ApiTags('Comments')
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('comment/post/:postId')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crea un nuevo comentario en una publicación' })
  @ApiResponse({
    status: 201,
    description: 'El comentario ha sido creado exitosamente.',
    type: Comment,
  })
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ): Promise<Comment> {
    const dtoWithPostId = { ...createCommentDto, postId };
    return this.commentService.create(dtoWithPostId, req.user.id);
  }

  @Get('post/:postId/comments')
  @ApiOperation({ summary: 'Obtiene todos los comentarios de un post' })
  @ApiResponse({
    status: 200,
    description: 'Comentarios obtenidos exitosamente.',
    type: [Comment],
  })
  findAll(@Param('postId') postId: string): Promise<Comment[]> {
    return this.commentService.findAll(postId);
  }

  @Get('comment/:id')
  @ApiOperation({ summary: 'Obtiene un comentario por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Comentario obtenido exitosamente.',
    type: Comment,
  })
  findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentService.findOne(id);
  }

  @Patch('comment/:id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualiza un comentario existente' })
  @ApiResponse({
    status: 200,
    description: 'El comentario ha sido actualizado exitosamente.',
    type: Comment,
  })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ): Promise<Comment> {
    return this.commentService.update(
      id,
      updateCommentDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('comment/:id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Elimina un comentario' })
  @ApiResponse({
    status: 200,
    description: 'El comentario ha sido eliminado exitosamente.',
  })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ): Promise<Comment> {
    return this.commentService.remove(id, req.user.id, req.user.role);
  }

  @Post('comment/:id/like')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Agrega o quita un like en un comentario' })
  @ApiResponse({
    status: 200,
    description: 'El like ha sido actualizado exitosamente.',
  })
  likeComment(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ): Promise<{ message: string }> {
    return this.commentService.likeComment(id, req.user.id);
  }

  @Post('comment/:commentId/reply')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crea una respuesta a un comentario existente' })
  @ApiResponse({
    status: 201,
    description: 'La respuesta ha sido creada exitosamente.',
    type: Comment,
  })
  async reply(
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ): Promise<Comment> {
    const parentComment = await this.commentService.findOne(commentId);
    const dtoWithRelations = {
      ...createCommentDto,
      postId: parentComment.postId,
      parentId: commentId,
    };
    return this.commentService.create(dtoWithRelations, req.user.id);
  }
}
