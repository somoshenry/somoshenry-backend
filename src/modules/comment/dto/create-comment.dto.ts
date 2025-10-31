import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiHideProperty()
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'El contenido del comentario',
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
