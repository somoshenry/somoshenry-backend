import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Envía un email de bienvenida
   */
  @Post('welcome')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendWelcome(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendWelcomeNotification(body.to);
  }

  /**
   * Envía un email de confirmación de pago exitoso
   */
  @Post('payment-success')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendPaymentSuccess(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendPaymentSuccessNotification(body.to);
  }

  /**
   * Envía un email informando que el pago fue rechazado
   */
  @Post('payment-rejected')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendPaymentRejected(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendPaymentRejectedNotification(body.to);
  }

  /**
   * Envía un email informando que un post fue deshabilitado
   */
  @Post('post-disabled')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendPostDisabled(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendPostDisabledNotification(body.to);
  }

  /**
   * Envía un email informando que el usuario ha sido baneado
   */
  @Post('user-banned')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendUserBanned(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendUserBannedNotification(body.to);
  }
}
