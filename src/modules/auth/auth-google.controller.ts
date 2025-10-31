import {
  Controller,
  Get,
  Res,
  UseGuards,
  Req,
  applyDecorators,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { GoogleService } from './google.service';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { SwaggerGoogleDocs } from './docs/auth-google.swagger';
import { envs } from 'src/config/envs.config';

@Controller('auth')
export class AuthGoogleController {
  constructor(private googleService: GoogleService) {}

  @Get('google')
  @applyDecorators(...SwaggerGoogleDocs.auth)
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @applyDecorators(...SwaggerGoogleDocs.callback)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const userProfile = req.user as GoogleProfileDto;
      const token = await this.googleService.generateToken(userProfile);
      const urlToken = `${envs.frontend.host}/auth/callback?token=${token}`;
      return res.redirect(urlToken);
    } catch (error) {
      console.error(error);
      const urlError = `${envs.frontend.host}/auth/error?error=${error}`;
      return res.redirect(urlError);
    }
  }
}
