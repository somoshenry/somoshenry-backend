import {
  Controller,
  Get,
  Res,
  UseGuards,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { ProfileResponseDto } from './dto/profile.response.dto';
import { GetUserProfile } from './decorator/get-user.decorator';
import { ResponseOkDto } from './dto/response.ok.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() user: Request, @Res() res: Response) {
    try {
      const token = this.authService.generateToken(
        user.user as GoogleProfileDto,
      );
      const urlWhitToken = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      return res.redirect(urlWhitToken);
    } catch (error) {
      console.error(error);
      const urlWhitError = `${process.env.FRONTEND_URL}/auth/error?error=${error}`;
      return res.redirect(urlWhitError);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUserProfile() user: GoogleProfileDto) {
    const response = new ProfileResponseDto();
    response.status = HttpStatus.OK;
    response.user = user;
    return response;
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  logout(@GetUserProfile() user: GoogleProfileDto) {
    console.log(user);
    // Implementa lógica de logout si es necesario (invalidar token, etc)
    return new ResponseOkDto();
  }
}
