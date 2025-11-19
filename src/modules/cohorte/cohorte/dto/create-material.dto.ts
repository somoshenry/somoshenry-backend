import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FileType,
  MaterialCategory,
} from '../entities/cohorte-material.entity';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Nombre del archivo',
    example: 'JavaScript_Avanzado.pdf',
  })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'URL del archivo (S3, Cloudinary, etc)',
    example: 'https://s3.amazonaws.com/bucket/files/js-avanzado.pdf',
  })
  @IsUrl()
  @MaxLength(1000)
  fileUrl: string;

  @ApiProperty({
    description: 'Tipo de archivo',
    enum: FileType,
    example: FileType.PDF,
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
    example: 1024000,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'MIME type del archivo',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Categoría del material',
    enum: MaterialCategory,
    default: MaterialCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @ApiPropertyOptional({
    description: 'Título personalizado del material',
    example: 'Guía completa de JavaScript ES6+',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción del material',
    example: 'Material de apoyo para el módulo 2 sobre JavaScript moderno',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Si el material es visible para estudiantes',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Tags para facilitar búsqueda',
    example: ['javascript', 'es6', 'modulo2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
