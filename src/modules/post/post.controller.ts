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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '../user/entities/user.entity';
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
import { ModeratePostDocs } from './docs/moderate-post.swagger';
import { GetReportedPostsDocs } from './docs/get-reported-posts.swagger';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { PostLimitGuard } from 'src/common/guards/post-limit.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { EmitEvent } from 'src/common/events/decorators/emit-event.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @HttpPost()
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @UseGuards(PostLimitGuard) // Aplicar el guardia de límite de publicaciones
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
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @GetPostsFeedDocs()
  findAll(@Query() filterDto: FilterPostsDto, @CurrentUser() user?: User) {
    return this.postService.findAllWithFilters(filterDto, user);
  }

  @Get('moderated')
  @AuthProtected(UserRole.ADMIN)
  @GetPostsFeedDocs()
  async getModeratedPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postService.findModerated(page, limit);
  }

  @Get('reported')
  @AuthProtected(UserRole.ADMIN)
  @GetReportedPostsDocs()
  async getReportedPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.postService.findReported(page, limit);
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

  @Patch(':id/moderate')
  @AuthProtected(UserRole.ADMIN)
  @ModeratePostDocs()
  async moderatePost(
    @Param('id') id: string,
    @Body('isInappropriate') isInappropriate: boolean,
    @Req() req: Request & { user: { id: string; role: UserRole } },
  ) {
    return this.postService.moderatePost(id, isInappropriate, req.user.id);
  }

  @HttpPost(':id/like')
  @EmitEvent('post.liked')
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

  @HttpPost(':id/dislike')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async dislikePost(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.dislikePost(postId, req.user.id);
  }

  @Delete(':id/undislike')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  async removeDislike(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.removeDislike(postId, req.user.id);
  }

  @Get(':id/dislikes')
  async getDislikesCount(@Param('id') postId: string) {
    return this.postService.getDislikesCount(postId);
  }

  @HttpPost(':id/view')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  registerView(
    @Param('id') postId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.postService.registerView(postId, req.user.id);
  }
}
