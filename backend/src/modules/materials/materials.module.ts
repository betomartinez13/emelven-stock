import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Category } from '../categories/entities/category.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Category, Supplier, InventoryEntry, InventoryExit]), AuditLogModule],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
