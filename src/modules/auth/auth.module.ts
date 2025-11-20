import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthGoogleController } from './auth-google.controller';
import { GoogleStrategy } from './strategy/google.strategy';
import { GoogleService } from './google.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../user/entities/user.entity';
import { GmailModule } from '../gmail/gmail.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
          algorithm: 'HS256',
        },
      }),
    }),
    TypeOrmModule.forFeature([PasswordResetToken, User]),
    UserModule,
    GmailModule,
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, JwtStrategy, PasswordResetService],
  exports: [AuthService, JwtModule, PasswordResetService],
})
export class AuthModule {
  static register(config: ConfigService): DynamicModule {
    const googleClientId = config.get('GOOGLE_CLIENT_ID') as string;
    const googleClientSecret = config.get('GOOGLE_CLIENT_SECRET') as string;

    const providers: any[] = [AuthService, JwtStrategy, PasswordResetService];
    const controllers: any[] = [AuthController, PasswordResetController];

    if (googleClientId && googleClientSecret) {
      providers.push(GoogleStrategy, GoogleService);
      controllers.push(AuthGoogleController);
    }

    return {
      module: AuthModule,
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: '7d',
              algorithm: 'HS256',
            },
          }),
        }),
        TypeOrmModule.forFeature([PasswordResetToken, User]),
        UserModule,
        GmailModule,
      ],
      controllers,
      providers,
      exports: [AuthService, JwtModule, JwtStrategy, PasswordResetService],
    };
  }
}
