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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsFeedDocs } from './docs/get-posts.swagger';
import { GetPostByIdDocs } from './docs/get-post-by-id.swagger';
import { CreatePostDocs } from './docs/create-post.swagger';
import { UpdatePostDocs } from './docs/update-post.swagger';
import { DeletePostDocs } from './docs/delete-post.swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @CreatePostDocs()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
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
  @UpdatePostDocs()
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  @DeletePostDocs()
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
