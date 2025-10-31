import { Module } from '@nestjs/common';
import { ConfigFactory, ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import typeOrmConfig from './config/typeorm.config';

// Modules
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { FollowModule } from './modules/follow/follow.module';
<<<<<<< HEAD
import { FilesModule } from './modules/files/files.module';
=======
import typeOrmConfig from './config/typeorm.config';

import { CommentModule } from './modules/comment/comment.module';
import { GmailModule } from './modules/gmail/gmail.module';
>>>>>>> d8afc548ece0848e020afbff31170caaa99e0b1a

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      load: [typeOrmConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('typeorm') as ConfigFactory;
        return {
          ...dbConfig,
        };
      },
    }),

    // Feature modules
    UserModule,
    AuthModule.register(new ConfigService()),
    PostModule,
    FollowModule,
<<<<<<< HEAD
    FilesModule,
=======
    CommentModule,
    GmailModule,
>>>>>>> d8afc548ece0848e020afbff31170caaa99e0b1a
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
