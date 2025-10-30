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
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const token = this.googleService.generateToken(
        req.user as GoogleProfileDto,
      );
      const urlWhitToken = `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
      return res.redirect(urlWhitToken);
    } catch (error) {
      console.error(error);
      const urlWhitError = `${process.env.FRONTEND_URL}/auth/error?error=${error}`;
      return res.redirect(urlWhitError);
    }
  }
}
