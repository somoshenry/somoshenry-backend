import {
  Controller,
  Post,
  Body,
  applyDecorators,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Password Recovery')
@Controller('auth')
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  /**
   * Solicitar recuperación de contraseña
   * Envía un email al usuario con un enlace para resetear su contraseña
   */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordResetService.createResetToken(forgotPasswordDto.email);
  }

  /**
   * Resetear contraseña con token
   * Valida el token y actualiza la contraseña del usuario
   */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
