import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CohorteMaterialsService } from './cohorte-materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialsDto } from './dto/query-materials.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthProtected } from 'src/modules/auth/decorator/auth-protected.decorator';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { FileType, MaterialCategory } from './entities/cohorte-material.entity';
import {
  ApiCreateMaterial,
  ApiGetMaterials,
  ApiGetOneMaterial,
  ApiUpdateMaterial,
  ApiDeleteMaterial,
  ApiRegisterDownload,
  ApiToggleVisibility,
  ApiGetByCategory,
  ApiGetByType,
  ApiGetByTag,
  ApiGetStats,
  ApiGetRecent,
  ApiUpdateTags,
} from '../docs/cohorte-materials.docs';

@ApiTags('Cohorte - Materiales')
@Controller('cohorte/:cohorteId/materials')
export class CohorteMaterialsController {
  constructor(private readonly materialsService: CohorteMaterialsService) {}

  // ============================================
  // CREAR MATERIAL (Solo profesores)
  // ============================================
  @Post()
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiCreateMaterial()
  async create(
    @Param('cohorteId') cohorteId: string,
    @CurrentUser('id') userId: string,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    return await this.materialsService.create(
      cohorteId,
      userId,
      createMaterialDto,
    );
  }

  // ============================================
  // OBTENER TODOS LOS MATERIALES DEL COHORTE
  // ============================================
  @Get()
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetMaterials()
  async findAll(
    @Param('cohorteId') cohorteId: string,
    @Query() query: QueryMaterialsDto,
  ) {
    return await this.materialsService.findByCohorte(cohorteId, query);
  }

  // ============================================
  // OBTENER UN MATERIAL ESPECÍFICO
  // ============================================
  @Get(':id')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetOneMaterial()
  async findOne(@Param('id') id: string) {
    return await this.materialsService.findOne(id);
  }

  // ============================================
  // ACTUALIZAR MATERIAL
  // ============================================
  @Put(':id')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiUpdateMaterial()
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return await this.materialsService.update(id, userId, updateMaterialDto);
  }

  // ============================================
  // ELIMINAR MATERIAL
  // ============================================
  @Delete(':id')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiDeleteMaterial()
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.materialsService.remove(id, userId);
    return { message: 'Material eliminado exitosamente' };
  }

  // ============================================
  // REGISTRAR DESCARGA
  // ============================================
  @Post(':id/download')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiRegisterDownload()
  async registerDownload(@Param('id') id: string) {
    await this.materialsService.incrementDownloadCount(id);
    return { message: 'Descarga registrada' };
  }

  // ============================================
  // CAMBIAR VISIBILIDAD
  // ============================================
  @Patch(':id/visibility')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiToggleVisibility()
  async toggleVisibility(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.materialsService.toggleVisibility(id, userId);
  }

  // ============================================
  // OBTENER POR CATEGORÍA
  // ============================================
  @Get('category/:category')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetByCategory()
  async findByCategory(
    @Param('cohorteId') cohorteId: string,
    @Param('category') category: MaterialCategory,
  ) {
    return await this.materialsService.findByCategory(cohorteId, category);
  }

  // ============================================
  // OBTENER POR TIPO
  // ============================================
  @Get('type/:fileType')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetByType()
  async findByType(
    @Param('cohorteId') cohorteId: string,
    @Param('fileType') fileType: FileType,
  ) {
    return await this.materialsService.findByType(cohorteId, fileType);
  }

  // ============================================
  // BUSCAR POR TAG
  // ============================================
  @Get('tag/:tag')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetByTag()
  async findByTag(
    @Param('cohorteId') cohorteId: string,
    @Param('tag') tag: string,
  ) {
    return await this.materialsService.findByTag(cohorteId, tag);
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  @Get('stats/overview')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetStats()
  async getStats(@Param('cohorteId') cohorteId: string) {
    return await this.materialsService.getStats(cohorteId);
  }

  // ============================================
  // MATERIALES RECIENTES
  // ============================================
  @Get('recent/list')
  @AuthProtected(UserRole.MEMBER, UserRole.TEACHER, UserRole.ADMIN)
  @ApiGetRecent()
  async getRecent(
    @Param('cohorteId') cohorteId: string,
    @Query('limit') limit: number = 10,
  ) {
    return await this.materialsService.getRecent(cohorteId, limit);
  }

  // ============================================
  // ACTUALIZAR TAGS
  // ============================================
  @Patch(':id/tags')
  @AuthProtected(UserRole.TEACHER, UserRole.ADMIN)
  @ApiUpdateTags()
  async updateTags(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('tags') tags: string[],
  ) {
    return await this.materialsService.updateTags(id, userId, tags);
  }
}
