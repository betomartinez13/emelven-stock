import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialFilterDto } from './dto/material-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AuditEntity('Material')
@UseInterceptors(AuditInterceptor)
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'List materials with filters and pagination (all roles)' })
  findAll(@Query() dto: MaterialFilterDto) {
    return this.materialsService.findAll(dto);
  }

  // IMPORTANT: low-stock must be BEFORE :id to avoid routing conflict
  @Get('low-stock')
  @ApiOperation({ summary: 'List materials below minimum stock (all roles)' })
  findLowStock() {
    return this.materialsService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID (all roles)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create material (Admin, Warehouse)' })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update material (Admin, Warehouse)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete material (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.remove(id);
  }
}
