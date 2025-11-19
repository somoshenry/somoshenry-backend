import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService } from '../chat.service';

@Injectable()
export class GroupAdminGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<{ user: { id: string }; params: { groupId: string } }>();
    const userId = req.user?.id;
    const groupId = req.params?.groupId;

    const isAdmin = await this.chatService.isGroupAdmin(groupId, userId);
    if (!isAdmin)
      throw new ForbiddenException(
        'No tienes permisos de administrador en este grupo',
      );
    return true;
  }
}
