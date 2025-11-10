import { SetMetadata } from '@nestjs/common';

export const EMIT_EVENT_METADATA = 'emit:event';
export const EmitEvent = (name: string) =>
  SetMetadata(EMIT_EVENT_METADATA, name);
