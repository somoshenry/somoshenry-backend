import {
  Controller,
  Post,
  Body,
  HttpCode,
  applyDecorators,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto'; // Asumo que este DTO existe
import { CredentialDto } from './dto/credential.dto'; // Asumo que este DTO existe
import { User } from '../user/entities/user.entity'; // Asumo que este Entity existe
import { LoginResponseOkDto } from './dto/login.response.ok.dto'; // Asumo que este DTO existe
import { SwaggerAuthDocs } from './docs/swagger-auth.docs';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @applyDecorators(...SwaggerAuthDocs.register)
  registerUser(@Body() user: CreateUserDto): Promise<User> {
    console.log(user);
    // Nota: El servicio debe mapear el DTO a la entidad User antes de guardar
    return this.authService.registerUser(user as User);
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
