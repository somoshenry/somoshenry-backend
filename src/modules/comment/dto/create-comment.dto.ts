import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Contenido del comentario',
    example: '¡Excelente publicación!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiHideProperty()
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
