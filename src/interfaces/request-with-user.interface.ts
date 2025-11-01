import { Request } from 'express';
import { UserRole } from 'src/modules/user/entities/user.entity';

export interface UserPayload {
  sub: number;
  username: string;
  roles: UserRole[];
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}
