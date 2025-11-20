import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../user/entities/user.entity';
import { GmailService } from '../gmail/gmail.service';
import { GmailDataDto } from '../gmail/dto/gmail.data.dto';
import { passwordResetEmailTemplate } from './dto/password-reset-email-template.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DevLogger } from '../../common/utils/dev-logger';

@Injectable()
export class PasswordResetService {
  private readonly tokenExpirationMinutes = 30;

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private gmailService: GmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Crear un token de recuperación de contraseña y enviar email
   * @param email - Email del usuario
   * @returns { success: boolean, message: string }
   */
  async createResetToken(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        success: true,
        message:
          'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.',
      };
    }

    // Limpiar tokens anteriores expirados
    await this.passwordResetTokenRepo.delete({
      userId: user.id,
      expiresAt: LessThan(new Date()),
    });

    // Generar token aleatorio
    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(plainToken, 10);

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.tokenExpirationMinutes);

    // Guardar token hasheado en BD
    const resetToken = this.passwordResetTokenRepo.create({
      tokenHash,
      userId: user.id,
      user,
      expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepo.save(resetToken);

    // Construir enlace de recuperación
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${plainToken}`;

    // Preparar email
    const emailHtml = passwordResetEmailTemplate.replace(
      '{{RESET_LINK}}',
      resetLink,
    );

    const gmailDataDto = new GmailDataDto();
    gmailDataDto.to = email;
    gmailDataDto.subject = 'Recupera tu contraseña en Somos Henry';
    gmailDataDto.html = emailHtml;

    try {
      await this.gmailService.sendMessage(gmailDataDto);
      DevLogger.log(`Email de recuperación enviado a: ${email}`);
    } catch (error) {
      DevLogger.error(
        `Error enviando email de recuperación a ${email}:`,
        error,
      );
      // No lanzamos error porque el token ya está guardado
      // El usuario puede intentar nuevamente si no recibe el email
    }

    return {
      success: true,
      message:
        'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.',
    };
  }

  /**
   * Validar token de recuperación
   * @param plainToken - Token crudo del usuario
   * @returns { user: User, token: PasswordResetToken }
   */
  async validateToken(
    plainToken: string,
  ): Promise<{ user: User; token: PasswordResetToken }> {
    // Buscar todos los tokens válidos de este usuario
    const validTokens = await this.passwordResetTokenRepo.find({
      where: {
        used: false,
      },
      relations: ['user'],
    });

    // Encontrar el token que coincida y no esté expirado
    let matchedToken: PasswordResetToken | null = null;

    for (const token of validTokens) {
      const isValid = await bcrypt.compare(plainToken, token.tokenHash);
      if (isValid) {
        // Verificar que no esté expirado
        if (new Date() > token.expiresAt) {
          throw new BadRequestException('El token ha expirado');
        }
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    const user = await this.userRepository.findOne({
      where: { id: matchedToken.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { user, token: matchedToken };
  }

  /**
   * Resetear contraseña usando el token
   * @param plainToken - Token crudo del usuario
   * @param newPassword - Nueva contraseña
   * @returns { success: boolean, message: string }
   */
  async resetPassword(
    plainToken: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validar token
    const { user, token } = await this.validateToken(plainToken);

    // Verificar que no esté usado
    if (token.used) {
      throw new BadRequestException('Este token ya ha sido utilizado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Marcar token como usado
    token.used = true;
    await this.passwordResetTokenRepo.save(token);

    DevLogger.log(`Contraseña reseteada para usuario: ${user.email}`);

    return {
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente',
    };
  }

  /**
   * Limpiar tokens expirados (útil para mantenimiento)
   * @returns { deletedCount: number }
   */
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    const result = await this.passwordResetTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    DevLogger.log(`Tokens expirados eliminados: ${result.affected}`);

    return {
      deletedCount: result.affected || 0,
    };
  }
}
