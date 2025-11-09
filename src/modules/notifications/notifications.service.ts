import { Injectable } from '@nestjs/common';
import { GmailService } from '../gmail/gmail.service';
import { GmailDataDto } from '../gmail/dto/gmail.data.dto';
import { welcomeEmailTemplate } from './dto/welcom-email-template.dto';
import { paymentSuccessTemplate } from './dto/payment-success-template.dto';
import { paymentRejectedTemplate } from './dto/payment-rejected-template.dto';
import { postDisabledTemplate } from './dto/post-desabled-template.dto';
import { userBannedTemplate } from './dto/user-banned-template.dto';

@Injectable()
export class NotificationsService {
  constructor(private gmailService: GmailService) {}

  /**
   * Envía un email de bienvenida al nuevo usuario
   * @param to - Email del destinatario
   */
  async sendWelcomeNotification(to: string) {
    const gmailDataDto = this.mapToGmailDataDto(
      to,
      'Bienvenido a Somos Henry',
      welcomeEmailTemplate,
    );
    return await this.gmailService.sendMessage(gmailDataDto);
  }

  /**
   * Envía un email de confirmación de pago exitoso
   * @param to - Email del destinatario
   */
  async sendPaymentSuccessNotification(to: string) {
    const gmailDataDto = this.mapToGmailDataDto(
      to,
      'Pago procesado exitosamente',
      paymentSuccessTemplate,
    );
    return await this.gmailService.sendMessage(gmailDataDto);
  }

  /**
   * Envía un email informando que el pago fue rechazado
   * @param to - Email del destinatario
   */
  async sendPaymentRejectedNotification(to: string) {
    const gmailDataDto = this.mapToGmailDataDto(
      to,
      'Tu pago no pudo ser procesado',
      paymentRejectedTemplate,
    );
    return await this.gmailService.sendMessage(gmailDataDto);
  }

  /**
   * Envía un email informando que un post fue deshabilitado
   * @param to - Email del destinatario
   */
  async sendPostDisabledNotification(to: string) {
    const gmailDataDto = this.mapToGmailDataDto(
      to,
      'Tu publicación ha sido deshabilitada',
      postDisabledTemplate,
    );
    return await this.gmailService.sendMessage(gmailDataDto);
  }

  /**
   * Envía un email informando que el usuario ha sido baneado
   * @param to - Email del destinatario
   */
  async sendUserBannedNotification(to: string) {
    const gmailDataDto = this.mapToGmailDataDto(
      to,
      'Tu cuenta ha sido suspendida',
      userBannedTemplate,
    );
    return await this.gmailService.sendMessage(gmailDataDto);
  }

  /**
   * Método privado para mapear datos a GmailDataDto
   * @param to - Email del destinatario
   * @param subject - Asunto del email
   * @param body - Cuerpo del email en HTML
   */
  private mapToGmailDataDto(
    to: string,
    subject: string,
    body: string,
  ): GmailDataDto {
    const gmailDataDto = new GmailDataDto();
    gmailDataDto.to = to;
    gmailDataDto.subject = subject;
    gmailDataDto.html = body;
    return gmailDataDto;
  }
}
