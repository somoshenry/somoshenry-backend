import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { AuthProtected } from '../../auth/decorator/auth-protected.decorator';
import { Request } from 'express';
import {
  CreateNotificationDocs,
  GetNotificationsDocs,
  MarkAsReadDocs,
  MarkAllReadDocs,
  DeleteNotificationDocs,
} from './docs';
interface AuthRequest extends Request {
  user: { id: string };
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @CreateNotificationDocs()
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get()
  @AuthProtected()
  @GetNotificationsDocs()
  async findAll(@Req() req: AuthRequest) {
    return this.notificationService.findAllForUser(req.user.id);
  }

  @Patch(':id/read')
  @AuthProtected()
  @MarkAsReadDocs()
  async markAsRead(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @AuthProtected()
  @MarkAllReadDocs()
  async markAllAsRead(@Req() req: AuthRequest) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @AuthProtected()
  @DeleteNotificationDocs()
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.notificationService.remove(id, req.user.id);
  }
}
