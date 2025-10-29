import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialDto } from './dto/credential.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  registerUser(@Body() user: CreateUserDto) {
    console.log(user);
    return this.authService.registerUser(user);
  }

  @Post('login')
  login(@Body() credenctial: CredentialDto) {
    return this.authService.login(credenctial);
  }

  @Post('update-password')
  updatePassword(@Body() credenctial: CredentialDto) {
    return this.authService.updatePassword(
      credenctial.username,
      credenctial.password,
    );
  }
}
