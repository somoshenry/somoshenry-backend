import { Controller, Post, Body, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CredentialDto } from './dto/credential.dto';
import { User } from '../user/entities/user.entity';
import { SwaggerAuthDocs } from './docs/swagger-auth.docs';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @applyDecorators(...SwaggerAuthDocs.register)
  registerUser(@Body() user: CreateUserDto) {
    return this.authService.registerUser(user as User);
  }

  @Post('login')
  @applyDecorators(...SwaggerAuthDocs.login)
  login(@Body() credenctial: CredentialDto) {
    return this.authService.login(credenctial);
  }

  @Post('update-password')
  @applyDecorators(...SwaggerAuthDocs.updatePassword)
  updatePassword(@Body() credenctial: CredentialDto) {
    return this.authService.updatePassword(
      credenctial.username,
      credenctial.password,
    );
  }
}
