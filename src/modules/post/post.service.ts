import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postsRepository: Repository<Post>,
  ) {}
  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postsRepository.create({ ...createPostDto, userId });
    return await this.postsRepository.save(post);
  }
  async findAll() {
    return await this.postsRepository.find();
  }
  //   findOne(id: number) {
  //     return `This action returns a #${id} post`;
  //   }
  //   update(id: number, updatePostDto: UpdatePostDto) {
  //     return `This action updates a #${id} post`;
  //   }
  //   remove(id: number) {
  //     return `This action removes a #${id} post`;
  //   }
}
