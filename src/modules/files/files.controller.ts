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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Put('uploadPostFile/:postId')
  // Utilizo un iterceptor para guardar en la metadata el archivo que viene en el campo file de la solicitud
  @UseInterceptors(FileInterceptor('file'))
  // Accedo a la metadata con el decorador y guardo el archivo en file de tipo Express.Multer.File
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 20000000,
            message: 'File must be max 20 MB',
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
    // console.log(file);
    return this.fileService.uploadPostFile(file, postId);
  }

  @Put('uploadProfilePicture/:userId')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 200000,
            message: 'File must be max 200 KB',
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
    // console.log(file);
    return this.fileService.uploadProfilePicture(file, userId);
  }

  @Put('uploadCoverPicture/:userId')
  @UseInterceptors(FileInterceptor('file'))
  uploadCoverPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 200000,
            message: 'File must be max 200 KB',
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
    // console.log(file);
    return this.fileService.uploadCoverPicture(file, userId);
  }

  @Delete('deletePostFile/:postId')
  deletePostFile(@Param('postId') postId: string) {
    return this.fileService.deletePostFile(postId);
  }

  @Delete('deleteUserProfilePicture/:userId')
  deleteUserProfilePicture(@Param('userId') userId: string) {
    return this.fileService.deleteUserProfilePicture(userId);
  }

  @Delete('deleteUserCoverPicture/:userId')
  deleteUserCoverPicture(@Param('userId') userId: string) {
    return this.fileService.deleteUserCoverPicture(userId);
  }
}
