import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './module-users/user.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    //PassportModule.register({ defaultStrategy: 'jwt' }),
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
  providers: [AuthService, UserRepository],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
