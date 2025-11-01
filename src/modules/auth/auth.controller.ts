import {
  Controller,
  Post,
  Body,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CredentialDto } from './dto/credential.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { SwaggerAuthDocs } from './docs/swagger-auth.docs';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

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

  @ApiBearerAuth('JWT-auth')
  @Post('update-password')
  //@Roles(UserRole.ADMIN)
  //@UseGuards(AuthGuard, RolesGuard)
  @applyDecorators(...SwaggerAuthDocs.updatePassword)
  updatePassword(@Body() credenctial: CredentialDto) {
    return this.authService.updatePassword(
      credenctial.username,
      credenctial.password,
    );
  }
}
