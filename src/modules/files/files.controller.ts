import {
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  // 📸 Subir archivo a un post
  @Put('uploadPostFile/:postId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir archivo de post',
    description:
      'Sube una imagen o video asociado a un post. Se valida tamaño y tipo de archivo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Archivo subido exitosamente' })
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 20000000,
            message: 'El archivo debe pesar máximo 20 MB',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp|mp4|mov|avi|wmv|mkv|webm)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.fileService.uploadPostFile(file, postId);
  }

  // 🧑‍🦱 Subir foto de perfil
  @Put('uploadProfilePicture/:userId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir foto de perfil',
    description:
      'Sube una imagen de perfil para el usuario. Máximo 200 KB. Solo formatos JPG, JPEG, PNG o WEBP.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada' })
  uploadProfilePicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 200000,
            message: 'El archivo debe pesar máximo 200 KB',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.fileService.uploadProfilePicture(file, userId);
  }

  // 🖼️ Subir foto de portada
  @Put('uploadCoverPicture/:userId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir foto de portada',
    description:
      'Sube una imagen de portada para el usuario. Máximo 200 KB. Solo formatos JPG, JPEG, PNG o WEBP.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto de portada actualizada' })
  uploadCoverPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 200000,
            message: 'El archivo debe pesar máximo 200 KB',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.fileService.uploadCoverPicture(file, userId);
  }

  // 🗑️ Eliminar archivo de post
  @Delete('deletePostFile/:postId')
  @ApiOperation({ summary: 'Eliminar archivo de post' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado correctamente' })
  deletePostFile(@Param('postId') postId: string) {
    return this.fileService.deletePostFile(postId);
  }

  // 🗑️ Eliminar foto de perfil
  @Delete('deleteUserProfilePicture/:userId')
  @ApiOperation({ summary: 'Eliminar foto de perfil' })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil eliminada correctamente',
  })
  deleteUserProfilePicture(@Param('userId') userId: string) {
    return this.fileService.deleteUserProfilePicture(userId);
  }

  // 🗑️ Eliminar foto de portada
  @Delete('deleteUserCoverPicture/:userId')
  @ApiOperation({ summary: 'Eliminar foto de portada' })
  @ApiResponse({
    status: 200,
    description: 'Foto de portada eliminada correctamente',
  })
  deleteUserCoverPicture(@Param('userId') userId: string) {
    return this.fileService.deleteUserCoverPicture(userId);
  }
}
