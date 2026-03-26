import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryEntry } from './entities/inventory-entry.entity';
import { InventoryExit } from './entities/inventory-exit.entity';
import { Material } from '../materials/entities/material.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryEntry, InventoryExit, Material]), AuditLogModule, AlertsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
