import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  receiverId: string;

  @IsUUID()
  senderId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  metadata?: Record<string, any>;
}
