import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Usuario } from '../modules/user/entities/user.entity';
import { Post } from '../modules/post/entities/post.entity';
import { Follow } from '../modules/follow/entities/follow.entity'; // 👈 importa Follow
import typeormConfig from '../config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const configFactory = typeormConfig as any;
        return {
          ...configFactory(),
          entities: [Usuario, Post, Follow], // 👈 aseguramos que estén registradas
        };
      },
    }),
    TypeOrmModule.forFeature([Usuario, Post, Follow]), // 👈 también acá
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
