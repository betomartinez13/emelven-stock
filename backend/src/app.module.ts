import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    SuppliersModule,
    MaterialsModule,
    InventoryModule,
    AuditLogModule,
    WorkOrdersModule,
  ],
})
export class AppModule {}
