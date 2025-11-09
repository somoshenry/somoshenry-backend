import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService } from '../chat.service';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<{ user: { id: string }; params: { groupId: string } }>();
    const userId = req.user?.id;
    const groupId = req.params?.groupId;

    const isMember = await this.chatService.isGroupMember(groupId, userId);
    if (!isMember) throw new ForbiddenException('No perteneces a este grupo');
    return true;
  }
}
