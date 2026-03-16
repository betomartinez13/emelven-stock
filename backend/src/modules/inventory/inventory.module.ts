import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryEntry } from './entities/inventory-entry.entity';
import { InventoryExit } from './entities/inventory-exit.entity';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryEntry, InventoryExit, Material])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
