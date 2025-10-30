import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { AuthGoogleController } from './auth-google.controller';
import { GoogleStrategy } from './strategy/google.strategy';
import { GoogleService } from './google.service';
import { JwtStrategy } from './strategy/jwt.strategy';

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
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {
  static register(config: ConfigService): DynamicModule {
    const googleClientId = config.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = config.get('GOOGLE_CLIENT_SECRET');

    const providers: any[] = [AuthService, JwtStrategy];
    const controllers: any[] = [AuthController];

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
        UserModule,
      ],
      controllers,
      providers,
      exports: [AuthService, JwtModule],
    };
  }
}
