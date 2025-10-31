import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new comment on a post' })
  @ApiResponse({
    status: 201,
    description: 'El comentario ha sido creado exitosamente.',
    type: Comment,
  })
  create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    createCommentDto.postId = postId;
    return this.commentService.create(createCommentDto, req.user.id);
  }

  @Get('post/:postId/comments')
  @ApiOperation({ summary: 'Get all comments from a post' })
  @ApiResponse({
    status: 200,
    description: 'Return all comments from the post',
    type: [Comment],
  })
  findAll(@Param('postId') postId: string) {
    return this.commentService.findAll(postId);
  }

  @Get('comment/:id')
  @ApiOperation({ summary: 'Get a comment by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the comment',
    type: Comment,
  })
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Patch('comment/:id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'El comentario ha sido actualizado exitosamente.',
    type: Comment,
  })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.commentService.update(id, updateCommentDto, req.user.id);
  }

  @Delete('comment/:id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({
    status: 200,
    description: 'El comentario ha sido eliminado exitosamente.',
  })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.commentService.remove(id, req.user.id);
  }

  @Post('comment/:id/like')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({
    status: 200,
    description: 'El like ha sido actualizado exitosamente.',
  })
  likeComment(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.commentService.likeComment(id, req.user.id);
  }

  @Post('comment/:commentId/reply')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reply to a comment' })
  @ApiResponse({
    status: 201,
    description: 'La respuesta ha sido creada exitosamente.',
    type: Comment,
  })
  reply(
    @Param('commentId') commentId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    const comment = this.commentService.findOne(commentId).then((comment) => {
      createCommentDto.postId = comment.postId;
      createCommentDto.parentId = commentId;
      return this.commentService.create(createCommentDto, req.user.id);
    });
    return comment;
  }
}
