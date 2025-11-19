import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  CohorteMaterial,
  FileType,
  MaterialCategory,
} from './entities/cohorte-material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialsDto } from './dto/query-materials.dto';

@Injectable()
export class CohorteMaterialsService {
  constructor(
    @InjectRepository(CohorteMaterial)
    private readonly materialsRepository: Repository<CohorteMaterial>,
  ) {}

  // ============================================
  // CREAR MATERIAL
  // ============================================
  async create(
    cohorteId: string,
    uploadedBy: string,
    createMaterialDto: CreateMaterialDto,
  ): Promise<CohorteMaterial> {
    const material = this.materialsRepository.create({
      cohorteId,
      uploadedBy,
      ...createMaterialDto,
    });
    return await this.materialsRepository.save(material);
  }

  // ============================================
  // OBTENER TODOS LOS MATERIALES DE UN COHORTE
  // ============================================
  async findByCohorte(
    cohorteId: string,
    query: QueryMaterialsDto,
  ): Promise<{ data: CohorteMaterial[]; meta: any }> {
    const {
      category,
      fileType,
      isVisible,
      search,
      tag,
      page = 1,
      limit = 20,
    } = query;

    const queryBuilder = this.materialsRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.uploader', 'uploader')
      .where('material.cohorteId = :cohorteId', { cohorteId });

    // Filtros
    if (category) {
      queryBuilder.andWhere('material.category = :category', { category });
    }

    if (fileType) {
      queryBuilder.andWhere('material.fileType = :fileType', { fileType });
    }

    if (isVisible !== undefined) {
      queryBuilder.andWhere('material.isVisible = :isVisible', { isVisible });
    }

    if (search) {
      queryBuilder.andWhere(
        '(material.fileName ILIKE :search OR material.title ILIKE :search OR material.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(material.tags)', { tag });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenar por fecha de creación (más recientes primero)
    queryBuilder.orderBy('material.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // OBTENER UN MATERIAL POR ID
  // ============================================
  async findOne(id: string): Promise<CohorteMaterial> {
    const material = await this.materialsRepository.findOne({
      where: { id },
      relations: ['uploader', 'cohorte'],
    });

    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    return material;
  }

  // ============================================
  // ACTUALIZAR MATERIAL
  // ============================================
  async update(
    id: string,
    userId: string,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<CohorteMaterial> {
    const material = await this.findOne(id);

    // Verificar que el usuario sea el que subió el archivo
    if (material.uploadedBy !== userId) {
      throw new ForbiddenException(
        'Solo puedes actualizar materiales que tú subiste',
      );
    }

    Object.assign(material, updateMaterialDto);

    return await this.materialsRepository.save(material);
  }

  // ============================================
  // ELIMINAR MATERIAL
  // ============================================
  async remove(id: string, userId: string): Promise<void> {
    const material = await this.findOne(id);

    // Verificar que el usuario sea el que subió el archivo
    if (material.uploadedBy !== userId) {
      throw new ForbiddenException(
        'Solo puedes eliminar materiales que tú subiste',
      );
    }

    await this.materialsRepository.remove(material);
  }

  // ============================================
  // INCREMENTAR CONTADOR DE DESCARGAS
  // ============================================
  async incrementDownloadCount(id: string): Promise<void> {
    await this.materialsRepository.increment({ id }, 'downloadCount', 1);
  }

  // ============================================
  // CAMBIAR VISIBILIDAD
  // ============================================
  async toggleVisibility(id: string, userId: string): Promise<CohorteMaterial> {
    const material = await this.findOne(id);

    if (material.uploadedBy !== userId) {
      throw new ForbiddenException(
        'Solo puedes cambiar la visibilidad de materiales que tú subiste',
      );
    }

    material.isVisible = !material.isVisible;

    return await this.materialsRepository.save(material);
  }

  // ============================================
  // OBTENER MATERIALES POR CATEGORÍA
  // ============================================
  async findByCategory(
    cohorteId: string,
    category: MaterialCategory,
  ): Promise<CohorteMaterial[]> {
    return await this.materialsRepository.find({
      where: { cohorteId, category, isVisible: true },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============================================
  // OBTENER MATERIALES POR TIPO
  // ============================================
  async findByType(
    cohorteId: string,
    fileType: FileType,
  ): Promise<CohorteMaterial[]> {
    return await this.materialsRepository.find({
      where: { cohorteId, fileType, isVisible: true },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  // ============================================
  // BUSCAR POR TAG
  // ============================================
  async findByTag(cohorteId: string, tag: string): Promise<CohorteMaterial[]> {
    return await this.materialsRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.uploader', 'uploader')
      .where('material.cohorteId = :cohorteId', { cohorteId })
      .andWhere(':tag = ANY(material.tags)', { tag })
      .andWhere('material.isVisible = :isVisible', { isVisible: true })
      .orderBy('material.createdAt', 'DESC')
      .getMany();
  }

  // ============================================
  // ESTADÍSTICAS DE MATERIALES
  // ============================================
  async getStats(cohorteId: string) {
    const total = await this.materialsRepository.count({
      where: { cohorteId },
    });

    const visible = await this.materialsRepository.count({
      where: { cohorteId, isVisible: true },
    });

    const byCategory = await this.materialsRepository
      .createQueryBuilder('material')
      .select('material.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('material.cohorteId = :cohorteId', { cohorteId })
      .groupBy('material.category')
      .getRawMany();

    const byType = await this.materialsRepository
      .createQueryBuilder('material')
      .select('material.fileType', 'fileType')
      .addSelect('COUNT(*)', 'count')
      .where('material.cohorteId = :cohorteId', { cohorteId })
      .groupBy('material.fileType')
      .getRawMany();

    const totalDownloads = await this.materialsRepository
      .createQueryBuilder('material')
      .select('SUM(material.downloadCount)', 'total')
      .where('material.cohorteId = :cohorteId', { cohorteId })
      .getRawOne();

    const mostDownloaded = await this.materialsRepository.find({
      where: { cohorteId },
      order: { downloadCount: 'DESC' },
      take: 5,
      relations: ['uploader'],
    });

    return {
      total,
      visible,
      hidden: total - visible,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: parseInt(item.count),
      })),
      byType: byType.map((item) => ({
        fileType: item.fileType,
        count: parseInt(item.count),
      })),
      totalDownloads: parseInt(totalDownloads?.total || '0'),
      mostDownloaded,
    };
  }

  // ============================================
  // OBTENER MATERIALES MÁS RECIENTES
  // ============================================
  async getRecent(
    cohorteId: string,
    limit: number = 10,
  ): Promise<CohorteMaterial[]> {
    return await this.materialsRepository.find({
      where: { cohorteId, isVisible: true },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ============================================
  // ACTUALIZAR TAGS
  // ============================================
  async updateTags(
    id: string,
    userId: string,
    tags: string[],
  ): Promise<CohorteMaterial> {
    const material = await this.findOne(id);

    if (material.uploadedBy !== userId) {
      throw new ForbiddenException(
        'Solo puedes actualizar tags de materiales que tú subiste',
      );
    }

    material.tags = tags;

    return await this.materialsRepository.save(material);
  }
}
