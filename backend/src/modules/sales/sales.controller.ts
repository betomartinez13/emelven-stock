import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleFilterDto } from './dto/sale-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AuditEntity('Sale')
@UseInterceptors(AuditInterceptor)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List sales with filters (all roles)' })
  findAll(@Query() dto: SaleFilterDto) {
    return this.salesService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID (all roles)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Record a sale (Admin, Warehouse)' })
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: User) {
    return this.salesService.create(dto, user.id);
  }
}
