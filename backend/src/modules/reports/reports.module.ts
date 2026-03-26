import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Material } from '../materials/entities/material.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Sale } from '../sales/entities/sale.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, WorkOrder, Sale, InventoryEntry, InventoryExit]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
