import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '../user/entities/user.entity';
import type { Request } from 'express';

import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsFeedDocs } from './docs/get-posts.swagger';
import { GetPostByIdDocs } from './docs/get-post-by-id.swagger';
import { CreatePostDocs } from './docs/create-post.swagger';
import { UpdatePostDocs } from './docs/update-post.swagger';
import { DeletePostDocs } from './docs/delete-post.swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { PayloadJwt } from '../auth/dto/payload-jwt';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @CreatePostDocs()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.MEMBER)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createPostDto: CreatePostDto, @Req() req: Request) {
    const user = req.user as PayloadJwt;
    return this.postService.create(createPostDto, user.sub);
  }

  @Get()
  @GetPostsFeedDocs()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postService.findAll(page, limit);
  }

  @Get(':id')
  @GetPostByIdDocs()
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.MEMBER)
  @UseGuards(AuthGuard, RolesGuard)
  @UpdatePostDocs()
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.update(id, updatePostDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.MEMBER)
  @UseGuards(AuthGuard, RolesGuard)
  @DeletePostDocs()
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.remove(id, req.user.id);
  }
}
