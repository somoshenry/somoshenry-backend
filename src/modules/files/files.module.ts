import { Module } from '@nestjs/common';
import { CloudinaryConfig } from 'src/config/cloudinary.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { User } from '../user/entities/user.entity';
import { CohorteMaterial } from '../cohorte/cohorte/entities/cohorte-material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, CohorteMaterial])],
  controllers: [FilesController],
  providers: [FilesService, CloudinaryConfig, FilesRepository],
})
export class FilesModule {}
