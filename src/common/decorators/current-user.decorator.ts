// import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { User } from '../../modules/user/entities/user.entity';

// export const CurrentUser = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext): User => {
//     const request = ctx.switchToHttp().getRequest();
//     return request.user;
//   },
// );

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
