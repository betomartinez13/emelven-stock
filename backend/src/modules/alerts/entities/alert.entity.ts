import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Material } from '../../materials/entities/material.entity';

export enum AlertType {
  LOW_STOCK      = 'stock_bajo',
  CRITICAL_STOCK = 'stock_critico',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Material, { eager: true })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column()
  materialId: number;

  @Column({ type: 'enum', enum: AlertType })
  tipo: AlertType;

  @Column()
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}
