import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateExitDto } from './dto/create-exit.dto';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('entries')
  @ApiOperation({ summary: 'List inventory entries with filters (all roles)' })
  findAllEntries(@Query() dto: InventoryFilterDto) {
    return this.inventoryService.findAllEntries(dto);
  }

  @Post('entries')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create inventory entry — increases stock (Admin, Warehouse)' })
  createEntry(@Body() dto: CreateEntryDto, @CurrentUser() user: User) {
    return this.inventoryService.createEntry(dto, user.id);
  }

  @Get('exits')
  @ApiOperation({ summary: 'List inventory exits with filters (all roles)' })
  findAllExits(@Query() dto: InventoryFilterDto) {
    return this.inventoryService.findAllExits(dto);
  }

  @Post('exits')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Create inventory exit — decreases stock (Admin, Warehouse)' })
  createExit(@Body() dto: CreateExitDto, @CurrentUser() user: User) {
    return this.inventoryService.createExit(dto, user.id);
  }

  @Get('movements/:materialId')
  @ApiOperation({ summary: 'Get combined entry/exit history for a material (all roles)' })
  getMovements(@Param('materialId', ParseIntPipe) materialId: number) {
    return this.inventoryService.getMovements(materialId);
  }
}
