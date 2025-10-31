import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({
    description: 'Contenido del post',
    example: 'Este es mi primer post en la plataforma',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Tipo de post',
    enum: PostType,
    default: PostType.TEXT,
    example: PostType.TEXT,
  })
  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @ApiPropertyOptional({
    description: 'URL del archivo multimedia (imagen o video)',
    example: 'https://example.com/media/image.jpg',
  })
  @IsString()
  @IsOptional()
  mediaURL?: string;
}
