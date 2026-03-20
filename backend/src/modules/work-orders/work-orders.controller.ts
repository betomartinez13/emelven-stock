import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { WorkOrderFilterDto } from './dto/work-order-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('work-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AuditEntity('WorkOrder')
@UseInterceptors(AuditInterceptor)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List work orders with optional status filter (all roles)' })
  findAll(@Query() dto: WorkOrderFilterDto) {
    return this.workOrdersService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order by ID with materials (all roles)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workOrdersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create work order (Admin, Warehouse)' })
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update work order description/client (Admin, Warehouse)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update work order status (Admin, Warehouse)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.workOrdersService.updateStatus(id, dto);
  }

  @Post(':id/materials')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Add material consumption to work order (Admin, Warehouse)' })
  addMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMaterialDto,
    @CurrentUser() user: User,
  ) {
    return this.workOrdersService.addMaterial(id, dto, user.id);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: 'List materials consumed by work order (all roles)' })
  getMaterials(@Param('id', ParseIntPipe) id: number) {
    return this.workOrdersService.getMaterials(id);
  }
}
