import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly-consumption')
  @ApiOperation({ summary: 'Monthly material consumption by year (Admin, Manager)' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getMonthlyConsumption(@Query('year', ParseIntPipe) year: number) {
    return this.reportsService.getMonthlyConsumption(year);
  }

  @Get('project-consumption/:workOrderId')
  @ApiOperation({ summary: 'Material consumption for a specific work order (Admin, Manager)' })
  getProjectConsumption(@Param('workOrderId', ParseIntPipe) workOrderId: number) {
    return this.reportsService.getProjectConsumption(workOrderId);
  }

  @Get('kpi')
  @ApiOperation({ summary: 'KPI dashboard indicators (Admin, Manager)' })
  getKpis() {
    return this.reportsService.getKpis();
  }
}
