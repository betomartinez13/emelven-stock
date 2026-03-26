import { Controller, Get, Param, Query, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfService } from '../pdf/pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private pdfService: PdfService,
  ) {}

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

  @Get('export/pdf/monthly')
  @ApiOperation({ summary: 'Export monthly consumption PDF (Admin, Manager)' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async exportMonthlyPdf(
    @Query('year', ParseIntPipe) year: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getMonthlyConsumption(year);
    const buffer = await this.pdfService.generateMonthlyReport(data, `${user.nombre} ${user.apellido}`);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="consumo-mensual-${year}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/pdf/project/:workOrderId')
  @ApiOperation({ summary: 'Export project consumption PDF (Admin, Manager)' })
  async exportProjectPdf(
    @Param('workOrderId', ParseIntPipe) workOrderId: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getProjectConsumption(workOrderId);
    const buffer = await this.pdfService.generateProjectReport(data, `${user.nombre} ${user.apellido}`);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="consumo-proyecto-${workOrderId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/pdf/inventory')
  @ApiOperation({ summary: 'Export inventory status PDF (Admin, Manager)' })
  async exportInventoryPdf(@CurrentUser() user: User, @Res() res: Response) {
    const materials = await this.reportsService.findAllMaterials();
    const buffer = await this.pdfService.generateInventoryStatusReport(materials, `${user.nombre} ${user.apellido}`);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="inventario-actual.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
