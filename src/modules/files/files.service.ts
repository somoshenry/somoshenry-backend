import { Injectable, NotFoundException } from '@nestjs/common';
import { FilesRepository } from './files.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { Usuario } from '../user/entities/user.entity';
import {
  detectResourceTypeFromUrl,
  extractPublicIdFromUrl,
} from 'src/common/utils/cloudinaryUtils';

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
  ) {}

  async uploadPostFile(file: Express.Multer.File, postId: string) {
    const post = await this.postRepository.findOneBy({
      id: postId,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    // Intentar eliminar el archivo anterior si existe (en Cloudinary)
    if (post.mediaURL) {
      // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
      const publicId = extractPublicIdFromUrl(post.mediaURL);
      if (!publicId) {
        throw new Error('Could not extract public_id from URL');
      }
      const resourceType = detectResourceTypeFromUrl(post.mediaURL);

      // Se elimina el archivo de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );
      // Solo logueamos el resultado, pero no detenemos la ejecución
      if (result.result !== 'ok') {
        console.warn(`Previous file deletion result: ${result.result}`);
      }
    }

    const uploadResponse = await this.filesRepository.uploadFile(file);

    await this.postRepository.update(post.id, {
      mediaURL: uploadResponse.secure_url,
    });

    return await this.postRepository.findOneBy({
      id: postId,
    });
  }

  async uploadProfilePicture(file: Express.Multer.File, userId: string) {
    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Intentar eliminar la imagen de perfil anterior si existe (en Cloudinary)
    if (user.imagenPerfil) {
      // Extraigo el publicId y el tipo de la imagen desde la URL de Cloudinary
      const publicId = extractPublicIdFromUrl(user.imagenPerfil);
      if (!publicId) {
        throw new Error('Could not extract public_id from URL');
      }
      const resourceType = detectResourceTypeFromUrl(user.imagenPerfil);

      // Se elimina la imagen de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );
      // Solo logueamos el resultado, pero no detenemos la ejecución
      if (result.result !== 'ok') {
        console.warn(`Previous file deletion result: ${result.result}`);
      }
    }

    const uploadResponse = await this.filesRepository.uploadFile(file);

    await this.userRepository.update(user.id, {
      imagenPerfil: uploadResponse.secure_url,
    });

    return await this.userRepository.findOneBy({
      id: userId,
    });
  }

  async uploadCoverPicture(file: Express.Multer.File, userId: string) {
    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Intentar eliminar la imagen de portada anterior si existe (en Cloudinary)
    if (user.imagenPortada) {
      // Extraigo el publicId y el tipo de la imagen desde la URL de Cloudinary
      const publicId = extractPublicIdFromUrl(user.imagenPortada);
      if (!publicId) {
        throw new Error('Could not extract public_id from URL');
      }
      const resourceType = detectResourceTypeFromUrl(user.imagenPortada);

      // Se elimina la imagen de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );
      // Solo logueamos el resultado, pero no detenemos la ejecución
      if (result.result !== 'ok') {
        console.warn(`Previous file deletion result: ${result.result}`);
      }
    }

    const uploadResponse = await this.filesRepository.uploadFile(file);

    await this.userRepository.update(user.id, {
      imagenPortada: uploadResponse.secure_url,
    });

    return await this.userRepository.findOneBy({
      id: userId,
    });
  }

  async deletePostFile(postId: string) {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post || !post.mediaURL) {
      throw new NotFoundException('Post or file not found or already deleted');
    }

    // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
    const publicId = extractPublicIdFromUrl(post.mediaURL);
    if (!publicId) {
      throw new Error('Could not extract public_id from URL');
    }
    const resourceType = detectResourceTypeFromUrl(post.mediaURL);

    try {
      // Elimina de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );

      // Limpia el campo en la base de datos, usa directamente postId (el parámetro) en lugar de post.id
      const updateResult = await this.postRepository.update(
        { id: postId }, // Mejor usar objeto como criterio
        { mediaURL: null },
      );

      // Verifica que realmente se actualizó, updateResult.affected debe ser igual a 1
      if (updateResult.affected === 0) {
        throw new Error('Failed to update database');
      }
      // Para debugging rápido
      //   await this.postRepository.findOneBy({ id: postId }).then((updated) => {
      //     console.log('mediaURL después del update:', updated?.mediaURL); // debe ser null
      //   });

      return { message: 'File successfully deleted', result };
    } catch (error) {
      // Log para debugging
      console.error('Error in deletePostFile:', error);
      throw error;
    }
  }

  async deleteUserProfilePicture(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !user.imagenPerfil) {
      throw new NotFoundException('User or profile picture not found');
    }

    // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
    const publicId = extractPublicIdFromUrl(user.imagenPerfil);
    if (!publicId) {
      throw new Error('Could not extract public_id from URL');
    }
    const resourceType = detectResourceTypeFromUrl(user.imagenPerfil);

    try {
      // Elimina de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );

      // Limpia el campo en la base de datos, usa directamente userId (el parámetro) en lugar de user.id
      const updateResult = await this.userRepository.update(
        { id: userId }, // Mejor usar objeto como criterio
        { imagenPerfil: null },
      );

      // Verifica que realmente se actualizó, updateResult.affected debe ser igual a 1
      if (updateResult.affected === 0) {
        throw new Error('Failed to update database');
      }
      // Para debugging rápido
      //   await this.userRepository.findOneBy({ id: userId }).then((updated) => {
      //     console.log('mediaURL después del update:', updated?.mediaURL); // debe ser null
      //   });

      return { message: 'Profile picture successfully deleted', result };
    } catch (error) {
      // Log para debugging
      console.error('Error in deletePostFile:', error);
      throw error;
    }
  }

  async deleteUserCoverPicture(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !user.imagenPortada) {
      throw new NotFoundException('User or cover image not found');
    }

    // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
    const publicId = extractPublicIdFromUrl(user.imagenPortada);
    if (!publicId) {
      throw new Error('Could not extract public_id from URL');
    }
    const resourceType = detectResourceTypeFromUrl(user.imagenPortada);

    try {
      // Elimina de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );

      // Limpia el campo en la base de datos, usa directamente userId (el parámetro) en lugar de user.id
      const updateResult = await this.userRepository.update(
        { id: userId }, // Mejor usar objeto como criterio
        { imagenPortada: null },
      );

      // Verifica que realmente se actualizó, updateResult.affected debe ser igual a 1
      if (updateResult.affected === 0) {
        throw new Error('Failed to update database');
      }
      // Para debugging rápido
      //   await this.userRepository.findOneBy({ id: userId }).then((updated) => {
      //     console.log('mediaURL después del update:', updated?.mediaURL); // debe ser null
      //   });

      return { message: 'Cover image successfully deleted', result };
    } catch (error) {
      // Log para debugging
      console.error('Error in deletePostFile:', error);
      throw error;
    }
  }
}
