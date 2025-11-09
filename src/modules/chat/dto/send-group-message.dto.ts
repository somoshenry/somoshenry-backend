import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendGroupMessageDto {
  @ApiProperty({
    example: 'Hola grupo 👋',
    description: 'Contenido del mensaje',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: MessageType,
    example: MessageType.TEXT,
    description: 'Tipo de mensaje (texto, imagen, video, archivo, etc.)',
    required: false,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}
