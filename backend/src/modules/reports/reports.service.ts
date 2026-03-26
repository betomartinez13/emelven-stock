import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Raw } from 'typeorm';
import { Material } from '../materials/entities/material.entity';
import { WorkOrder, WorkOrderStatus } from '../work-orders/entities/work-order.entity';
import { Sale } from '../sales/entities/sale.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';
import {
  MonthlyConsumptionResponse,
  MonthlyConsumptionItem,
  ProjectConsumptionResponse,
  KpiResponse,
} from './dto/report-responses.dto';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Material)
    private materialsRepo: Repository<Material>,
    @InjectRepository(WorkOrder)
    private workOrdersRepo: Repository<WorkOrder>,
    @InjectRepository(Sale)
    private salesRepo: Repository<Sale>,
    @InjectRepository(InventoryEntry)
    private entriesRepo: Repository<InventoryEntry>,
    @InjectRepository(InventoryExit)
    private exitsRepo: Repository<InventoryExit>,
    private dataSource: DataSource,
  ) {}

  async getMonthlyConsumption(year: number): Promise<MonthlyConsumptionResponse> {
    const rows = await this.dataSource.query(
      `SELECT
        m.id            AS materialId,
        m.nombre        AS nombre,
        m.unidad        AS unidad,
        MONTH(e.fechaSalida) AS mes,
        SUM(e.cantidad) AS cantidad
      FROM inventory_exits e
      JOIN materials m ON e.materialId = m.id
      WHERE YEAR(e.fechaSalida) = ?
      GROUP BY m.id, m.nombre, m.unidad, MONTH(e.fechaSalida)
      ORDER BY m.nombre, mes`,
      [year],
    );

    const materialsMap = new Map<number, MonthlyConsumptionItem>();
    for (const row of rows) {
      if (!materialsMap.has(Number(row.materialId))) {
        materialsMap.set(Number(row.materialId), {
          materialId: Number(row.materialId),
          nombre: row.nombre,
          unidad: row.unidad,
          consumoPorMes: Array(12)
            .fill(0)
            .map((_, i) => ({ mes: i + 1, cantidad: 0 })),
        });
      }
      materialsMap.get(Number(row.materialId))!.consumoPorMes[Number(row.mes) - 1].cantidad = Number(row.cantidad);
    }

    return {
      year,
      labels: MONTH_LABELS,
      items: Array.from(materialsMap.values()),
    };
  }

  async getProjectConsumption(workOrderId: number): Promise<ProjectConsumptionResponse> {
    const workOrder = await this.workOrdersRepo.findOne({ where: { id: workOrderId } });
    if (!workOrder) throw new NotFoundException('Orden de trabajo no encontrada');

    const rows = await this.dataSource.query(
      `SELECT
        m.id            AS materialId,
        m.nombre        AS nombre,
        m.unidad        AS unidad,
        SUM(wom.cantidadUsada) AS cantidadUsada
      FROM work_order_materials wom
      JOIN materials m ON wom.materialId = m.id
      WHERE wom.workOrderId = ?
      GROUP BY m.id, m.nombre, m.unidad
      ORDER BY cantidadUsada DESC`,
      [workOrderId],
    );

    const total = rows.reduce((sum: number, r: any) => sum + Number(r.cantidadUsada), 0);

    return {
      workOrder: {
        id: workOrder.id,
        codigo: workOrder.codigo,
        descripcion: workOrder.descripcion,
        cliente: workOrder.cliente,
        estado: workOrder.estado,
        fechaInicio: workOrder.fechaInicio instanceof Date
          ? workOrder.fechaInicio.toISOString().split('T')[0]
          : String(workOrder.fechaInicio),
        fechaFin: workOrder.fechaFin
          ? (workOrder.fechaFin instanceof Date
              ? workOrder.fechaFin.toISOString().split('T')[0]
              : String(workOrder.fechaFin))
          : undefined,
      },
      materials: rows.map((r: any) => ({
        materialId: Number(r.materialId),
        nombre: r.nombre,
        unidad: r.unidad,
        cantidadUsada: Number(r.cantidadUsada),
        porcentaje: total > 0 ? Math.round((Number(r.cantidadUsada) / total) * 100) : 0,
      })),
      totalMovimientos: rows.length,
    };
  }

  async getKpis(): Promise<KpiResponse> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      totalMateriales,
      materialesSinStock,
      [{ entradasDelMes }],
      [{ salidasDelMes }],
      ordenesActivas,
      ordenesCompletadasMes,
      ventasMes,
      topMaterial,
    ] = await Promise.all([
      this.materialsRepo.count(),
      this.materialsRepo.count({ where: { stockActual: 0 } }),
      this.dataSource.query(
        `SELECT COUNT(*) as entradasDelMes FROM inventory_entries WHERE YEAR(fechaEntrada)=? AND MONTH(fechaEntrada)=?`,
        [year, month],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as salidasDelMes FROM inventory_exits WHERE YEAR(fechaSalida)=? AND MONTH(fechaSalida)=?`,
        [year, month],
      ),
      this.workOrdersRepo.count({ where: { estado: WorkOrderStatus.IN_PROGRESS } }),
      this.workOrdersRepo.count({
        where: {
          estado: WorkOrderStatus.COMPLETED,
          fechaFin: Raw((a) => `YEAR(${a})=${year} AND MONTH(${a})=${month}`),
        },
      }),
      this.salesRepo.count({
        where: { fecha: Raw((a) => `YEAR(${a})=${year} AND MONTH(${a})=${month}`) },
      }),
      this.dataSource.query(
        `SELECT m.nombre, m.unidad, SUM(e.cantidad) AS total
        FROM inventory_exits e JOIN materials m ON e.materialId = m.id
        WHERE YEAR(e.fechaSalida)=? AND MONTH(e.fechaSalida)=?
        GROUP BY m.id ORDER BY total DESC LIMIT 1`,
        [year, month],
      ),
    ]);

    // Count materials with stock below minimum (stockActual < stockMin AND stockMin > 0)
    const materialesConStockBajo = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM materials WHERE stockActual < stockMin AND stockMin > 0 AND stockActual > 0`,
    );

    return {
      totalMateriales,
      materialesConStockBajo: Number(materialesConStockBajo[0].cnt),
      materialesSinStock,
      entradasDelMes: Number(entradasDelMes),
      salidasDelMes: Number(salidasDelMes),
      ordenesActivas,
      ordenesCompletadasMes,
      ventasMes,
      materialMasConsumido: topMaterial[0]
        ? { nombre: topMaterial[0].nombre, cantidad: Number(topMaterial[0].total), unidad: topMaterial[0].unidad }
        : null,
    };
  }

  async findAllMaterials(): Promise<Material[]> {
    return this.materialsRepo.find({ order: { nombre: 'ASC' } });
  }
}
