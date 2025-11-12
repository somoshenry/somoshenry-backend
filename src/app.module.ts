import { Module } from '@nestjs/common';
import { ConfigFactory, ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import typeOrmConfig from './config/typeorm.config';

// Modules
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { FollowModule } from './modules/follow/follow.module';
import { CommentModule } from './modules/comment/comment.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { FilesModule } from './modules/files/files.module';
import { ReportModule } from './modules/report/report.module';
import { AdminDashboardModule } from './modules/dashboard/admin/admin-dashboard.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationModule } from './modules/notifications/socket/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubscriptionModule } from './modules/subscription/subscription.module';

// Event system
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { DomainEventsInterceptor } from './common/interceptors/domain-events.interceptor';
import { EventDispatcherService } from './common/events/event-dispatcher.service';

//Redis

import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      load: [typeOrmConfig],
    }),
    EventEmitterModule.forRoot(),
    //Database
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

    // Redis
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        url: configService.get<string>('REDIS_URL'),
        ttl: 60, // tiempo de vida de los datos en cache (segundos)
      }),
    }),

    // Event Emitter (para todo el sistema)
    EventEmitterModule.forRoot(),

    // Feature Modules
    UserModule,
    AuthModule.register(new ConfigService()),
    PostModule,
    FollowModule,
    CommentModule,
    GmailModule,
    FilesModule,
    ReportModule,
    AdminDashboardModule,
    DashboardModule,
    MercadoPagoModule,
    ChatModule,
    SubscriptionModule,
    SubscriptionModule,
    NotificationModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    AuditInterceptor,

    // Event infrastructure (nuevo)
    EventDispatcherService,
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useClass: DomainEventsInterceptor,
    },
  ],
})
export class AppModule {}
