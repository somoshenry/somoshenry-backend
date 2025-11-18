import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DomainEvent {
  name: string;
  payload: Record<string, any>;
}

@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger(EventDispatcherService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  dispatch(event: DomainEvent): void {
    if (!event?.name) {
      this.logger.warn(' Event sin nombre recibido');
      return;
    }

    this.eventEmitter.emit(event.name, event.payload);
  }
}
