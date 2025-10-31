import {
  Controller,
  Post,
  Body,
  HttpCode,
  applyDecorators,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CredentialDto } from './dto/credential.dto';
import { User } from '../user/entities/user.entity';
import { LoginResponseOkDto } from './dto/login.response.ok.dto';
import { SwaggerAuthDocs } from './docs/swagger-auth.docs';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @applyDecorators(...SwaggerAuthDocs.register)
  registerUser(@Body() user: CreateUserDto): Promise<User> {
    console.log(user);
    return this.authService.registerUser(user as unknown as User);
  }

  @Post('login')
  @applyDecorators(...SwaggerAuthDocs.login)
  login(@Body() credenctial: CredentialDto): Promise<LoginResponseOkDto> {
    return this.authService.login(credenctial);
  }

  @Post('update-password')
  @HttpCode(200)
  @applyDecorators(...SwaggerAuthDocs.updatePassword)
  updatePassword(
    @Body() credenctial: CredentialDto,
  ): Promise<{ message: string }> {
    return this.authService.updatePassword(
      credenctial.username,
      credenctial.password,
    );
  }
}
