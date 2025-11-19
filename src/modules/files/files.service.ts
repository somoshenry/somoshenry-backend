import { Injectable, NotFoundException } from '@nestjs/common';
import { FilesRepository } from './files.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostType } from '../post/entities/post.entity';
import { User } from '../user/entities/user.entity';
import {
  CohorteMaterial,
  FileType,
} from '../cohorte/cohorte/entities/cohorte-material.entity';
import {
  detectResourceTypeFromUrl,
  extractPublicIdFromUrl,
  getFileTypeFromUrl,
} from 'src/common/utils/cloudinaryUtils';

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CohorteMaterial)
    private readonly cohortMaterialRepository: Repository<CohorteMaterial>,
  ) {}

  async uploadPostFile(file: Express.Multer.File, postId: string) {
    // console.log('========================================');
    // console.log('INICIO uploadPostFile');
    // console.log('Archivo:', file.originalname, '|', file.mimetype);
    // console.log('PostId:', postId);

    const post = await this.postRepository.findOneBy({
      id: postId,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // console.log('Post encontrado - Type ANTES:', post.type);

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

    // console.log('⬆Subiendo el nuevo archivo a Cloudinary...');
    const uploadResponse = await this.filesRepository.uploadFile(file);
    // console.log('Cloudinary resource_type:', uploadResponse.resource_type);
    // console.log('Cloudinary URL:', uploadResponse.secure_url);

    // Determinar tipo (Cloudinary devuelve `resource_type`: 'image' | 'video' | 'raw')
    let newType: PostType = PostType.TEXT;
    if (uploadResponse.resource_type === 'image') {
      newType = PostType.IMAGE;
    } else if (uploadResponse.resource_type === 'video') {
      newType = PostType.VIDEO;
    }

    // console.log('Tipo determinado:', newType);
    // console.log(
    //   '¿Es enum válido?',
    //   Object.values(PostType).includes(newType),
    // );

    // Asignar valores
    // console.log('ANTES de asignar - post.type:', post.type);
    post.type = newType;
    post.mediaURL = uploadResponse.secure_url;
    // console.log('DESPUÉS de asignar - post.type:', post.type);

    // Guardar
    // console.log('Ejecutando save()...');
    const savedPost = await this.postRepository.save(post);
    // console.log('Resultado del save() - type:', savedPost.type);

    // Leer directamente de la DB con query nativa
    // console.log('Verificando con query nativa...');
    const rawResult = await this.postRepository.query(
      'SELECT id, type, media_url FROM posts WHERE id = $1',
      [postId],
    );
    // console.log('Query nativa resultado:', rawResult);

    // console.log('========================================');
    return savedPost;
  }

  async uploadProfilePicture(file: Express.Multer.File, userId: string) {
    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Intentar eliminar la imagen de perfil anterior si existe (en Cloudinary)
    if (user.profilePicture) {
      // Extraigo el publicId y el tipo de la imagen desde la URL de Cloudinary
      const publicId = extractPublicIdFromUrl(user.profilePicture);
      if (!publicId) {
        throw new Error('Could not extract public_id from URL');
      }
      const resourceType = detectResourceTypeFromUrl(user.profilePicture);

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
      profilePicture: uploadResponse.secure_url,
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
    if (user.coverPicture) {
      // Extraigo el publicId y el tipo de la imagen desde la URL de Cloudinary
      const publicId = extractPublicIdFromUrl(user.coverPicture);
      if (!publicId) {
        throw new Error('Could not extract public_id from URL');
      }
      const resourceType = detectResourceTypeFromUrl(user.coverPicture);

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
      coverPicture: uploadResponse.secure_url,
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
        { mediaURL: null, type: PostType.TEXT }, // Si existe el POST, al eliminar el archivo se vuelve TEXT
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
    if (!user || !user.profilePicture) {
      throw new NotFoundException('User or profile picture not found');
    }

    // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
    const publicId = extractPublicIdFromUrl(user.profilePicture);
    if (!publicId) {
      throw new Error('Could not extract public_id from URL');
    }
    const resourceType = detectResourceTypeFromUrl(user.profilePicture);

    try {
      // Elimina de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );

      // Limpia el campo en la base de datos, usa directamente userId (el parámetro) en lugar de user.id
      const updateResult = await this.userRepository.update(
        { id: userId }, // Mejor usar objeto como criterio
        { profilePicture: null },
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
    if (!user || !user.coverPicture) {
      throw new NotFoundException('User or cover image not found');
    }

    // Extraigo el publicId y el tipo de archivo desde la URL de Cloudinary
    const publicId = extractPublicIdFromUrl(user.coverPicture);
    if (!publicId) {
      throw new Error('Could not extract public_id from URL');
    }
    const resourceType = detectResourceTypeFromUrl(user.coverPicture);

    try {
      // Elimina de Cloudinary
      const result = await this.filesRepository.deleteFile(
        publicId,
        resourceType,
      );

      // Limpia el campo en la base de datos, usa directamente userId (el parámetro) en lugar de user.id
      const updateResult = await this.userRepository.update(
        { id: userId }, // Mejor usar objeto como criterio
        { coverPicture: null },
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

  async uploadCohortMaterialFile(
    file: Express.Multer.File,
    cohortMaterialId: string,
  ) {
    // console.log('========================================');
    // console.log('INICIO uploadCohortMaterialFile');
    // console.log('Archivo:', file.originalname, '|', file.mimetype);
    // console.log('cohortMaterialId:', cohortMaterialId);

    const cohortMaterial = await this.cohortMaterialRepository.findOneBy({
      id: cohortMaterialId,
    });

    if (!cohortMaterial) {
      throw new NotFoundException('cohortMaterial not found');
    }

    // console.log('cohortMaterial encontrado - Type ANTES:', cohortMaterial.type);

    // Intentar eliminar el archivo anterior si existe (en Cloudinary)
    if (
      cohortMaterial.fileUrl &&
      cohortMaterial.fileUrl.includes('cloudinary.com')
    ) {
      try {
        const publicId = extractPublicIdFromUrl(cohortMaterial.fileUrl);
        if (publicId) {
          const resourceType = detectResourceTypeFromUrl(
            cohortMaterial.fileUrl,
          );
          const result = await this.filesRepository.deleteFile(
            publicId,
            resourceType,
          );
          if (result.result !== 'ok') {
            console.warn(`Previous file deletion result: ${result.result}`);
          }
        }
      } catch (error) {
        console.warn('No se pudo eliminar el archivo anterior:', error.message);
      }
    }

    // console.log('⬆Subiendo el nuevo archivo a Cloudinary...');
    const uploadResponse = await this.filesRepository.uploadFile(file);
    // console.log('Cloudinary URL:', uploadResponse.secure_url);

    // Determinar tipo: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'SPREADSHEET' | 'PRESENTATION' | 'COMPRESSED' | 'OTHER'
    const fileCategory = getFileTypeFromUrl(file.originalname);

    // console.log('Tipo determinado:', fileCategory);
    // console.log(
    //   '¿Es enum válido?',
    //   Object.values(fileType).includes(fileCategory),
    // );

    // Asignar valores
    // console.log('ANTES de asignar - cohortMaterial.fileType:', cohortMaterial.fileType);
    cohortMaterial.fileType = fileCategory;
    cohortMaterial.fileUrl = uploadResponse.secure_url;
    // console.log('DESPUÉS de asignar - cohortMaterial.fileType:', cohortMaterial.fileType);
    cohortMaterial.mimeType = file.mimetype;
    cohortMaterial.fileName = file.originalname;
    cohortMaterial.fileSize = uploadResponse.bytes;

    // Guardar
    // console.log('Ejecutando save()...');
    const savedcohortMaterial =
      await this.cohortMaterialRepository.save(cohortMaterial);
    // console.log('Resultado del save() - type:', savedcohortMaterial.type);

    // Leer directamente de la DB con query nativa
    // console.log('Verificando con query nativa...');
    const rawResult = await this.cohortMaterialRepository.query(
      'SELECT id, file_type, file_url FROM cohorte_materials WHERE id = $1',
      [cohortMaterialId],
    );
    // console.log('Query nativa resultado:', rawResult);

    // console.log('========================================');
    return savedcohortMaterial;
  }

  async deleteCohortFile(cohortMaterialId: string) {
    // Buscar el material
    const cohortMaterial = await this.cohortMaterialRepository.findOneBy({
      id: cohortMaterialId,
    });

    if (!cohortMaterial || !cohortMaterial.fileUrl) {
      throw new NotFoundException('Material o archivo no encontrado');
    }

    let cloudinaryDeleteResult: { result: string } | null = null;

    // Intentar eliminar de Cloudinary
    if (cohortMaterial.fileUrl?.includes('cloudinary.com')) {
      try {
        const publicId = extractPublicIdFromUrl(cohortMaterial.fileUrl);
        if (publicId) {
          const resourceType = detectResourceTypeFromUrl(
            cohortMaterial.fileUrl,
          );
          cloudinaryDeleteResult = await this.filesRepository.deleteFile(
            publicId,
            resourceType,
          );

          if (cloudinaryDeleteResult?.result !== 'ok') {
            console.warn(
              `Cloudinary result: ${cloudinaryDeleteResult?.result}`,
            );
          }
        }
      } catch (error) {
        console.warn('Error eliminando de Cloudinary:', error.message);
      }
    }

    // Limpiar campos
    Object.assign(cohortMaterial, {
      fileUrl: null,
      fileType: FileType.OTHER,
      fileName: null,
      fileSize: null,
      mimeType: null,
    });

    // Guardar
    await this.cohortMaterialRepository.save(cohortMaterial);

    return {
      message: 'Archivo eliminado exitosamente',
      cloudinaryDeleteResult,
    };
  }
}
