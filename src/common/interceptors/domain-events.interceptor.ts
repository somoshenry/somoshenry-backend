import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import { EMIT_EVENT_METADATA } from '../events/decorators/emit-event.decorator';
import { EventDispatcherService } from '../events/event-dispatcher.service';

@Injectable()
export class DomainEventsInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly dispatcher: EventDispatcherService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const eventName = this.reflector.get<string>(
      EMIT_EVENT_METADATA,
      context.getHandler(),
    );
    if (!eventName) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<{
      user?: { id: string };
      params: any;
      body: any;
    }>();

    // el listener hará la carga completa con repos
    return next.handle().pipe(
      tap((result) => {
        const req = context.switchToHttp().getRequest();
        this.dispatcher.dispatch({
          name: eventName,
          payload: {
            userId: req.user?.id ?? null,
            body: req.body ?? null,
            params: req.params ?? null, // 👈 agregado
            query: req.query ?? null, // 👈 opcional, por si lo necesitás
            result, // lo que devuelve el handler
          },
        });
      }),
    );
  }
}
