import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class UpdateChatDto extends PartialType(CreateMessageDto) {}
