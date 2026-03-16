import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column()
  entidad: string;

  @Column({ nullable: true })
  entidadId: number;

  @Column({ type: 'enum', enum: AuditAction })
  accion: AuditAction;

  @Column({ type: 'json', nullable: true })
  datosAntes: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  datosDespues: Record<string, any> | null;

  @CreateDateColumn()
  fecha: Date;
}
