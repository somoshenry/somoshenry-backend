import {
  Controller,
  Get,
  Post as HttpPost,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '../user/entities/user.entity';
import { AuthProtected } from '../auth/decorator/auth-protected.decorator';
import { Request } from 'express';

import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsFeedDocs } from './docs/get-posts.swagger';
import { GetPostByIdDocs } from './docs/get-post-by-id.swagger';
import { CreatePostDocs } from './docs/create-post.swagger';
import { UpdatePostDocs } from './docs/update-post.swagger';
import { DeletePostDocs } from './docs/delete-post.swagger';
import { FilterPostsDto } from './dto/filter-posts.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @HttpPost()
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @CreatePostDocs()
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.create(createPostDto, req.user.id);
  }

  // @Get()
  // @GetPostsFeedDocs()
  // findAll(
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ) {
  //   return this.postService.findAll(page, limit);
  // }

  @Get()
  @GetPostsFeedDocs()
  findAll(@Query() filterDto: FilterPostsDto) {
    return this.postService.findAllWithFilters(filterDto);
  }

  @Get(':id')
  @GetPostByIdDocs()
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @UpdatePostDocs()
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.update(
      id,
      updatePostDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @DeletePostDocs()
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.remove(id, req.user.id, req.user.role);
  }

  @HttpPost(':id/like')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async likePost(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.likePost(postId, req.user.id);
  }

  @Delete(':id/unlike')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async unlikePost(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.unlikePost(postId, req.user.id);
  }

  @Get(':id/likes')
  async getLikesCount(@Param('id') postId: string) {
    return this.postService.getLikesCount(postId);
  }
}
