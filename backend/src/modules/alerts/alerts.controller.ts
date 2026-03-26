import { Controller, Get, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertFilterDto } from './dto/alert-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List all alerts with filters (all roles)' })
  findAll(@Query() dto: AlertFilterDto) {
    return this.alertsService.findAll(dto);
  }

  // IMPORTANT: /unread and /count must be BEFORE /:id to avoid routing conflict
  @Get('unread')
  @ApiOperation({ summary: 'List unread alerts (all roles)' })
  findUnread() {
    return this.alertsService.findUnread();
  }

  @Get('count')
  @ApiOperation({ summary: 'Count unread alerts (all roles)' })
  countUnread() {
    return this.alertsService.countUnread();
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read (all roles)' })
  markAllAsRead() {
    return this.alertsService.markAllAsRead();
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read (all roles)' })
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.markAsRead(id);
  }
}
